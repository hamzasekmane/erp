import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { clients, invoices } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate, type Pagination } from "../../shared/http";
import { fromMinor, toMinor } from "../../shared/money";
import type { CreateClientInput, UpdateClientInput } from "./clients.dto";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };
type ClientRow = typeof clients.$inferSelect;
type ListQuery = {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  type?: string;
  category?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
};

function cleanAddress(address: Record<string, string | null | undefined> | null | undefined): Record<string, string> {
  if (!address) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(address)) {
    if (typeof value === "string" && value.trim() !== "") result[key] = value.trim();
  }
  return result;
}

export function serializeClient(row: ClientRow, extra: Record<string, unknown> = {}) {
  return {
    id: row.id,
    _id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    name: row.name,
    type: row.type,
    category: row.category,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    taxNumber: row.taxNumber,
    commercialRegistration: row.commercialRegistration,
    contactPerson: row.contactPerson,
    notes: row.notes,
    address: row.address,
    billingAddress: row.billingAddress,
    balance: fromMinor(Number(row.balanceMinor)),
    creditLimit: fromMinor(Number(row.creditLimitMinor)),
    paymentTerms: row.paymentTerms,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...extra,
  };
}

@Injectable()
export class ClientsService {
  async list(ctx: Ctx, query: ListQuery): Promise<{ items: ReturnType<typeof serializeClient>[]; pagination: Pagination }> {
    const db = getDb();
    const filters: SQL[] = [eq(clients.tenantId, ctx.tenantId), isNull(clients.deletedAt)];
    if (query.type) filters.push(eq(clients.type, query.type));
    if (query.category) filters.push(eq(clients.category, query.category));
    if (query.isActive === "true" || query.isActive === "false") filters.push(eq(clients.isActive, query.isActive === "true"));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(
        sql`lower(${clients.name}) like ${term}`,
        sql`lower(${clients.code}) like ${term}`,
        sql`lower(coalesce(${clients.email}, '')) like ${term}`,
        sql`coalesce(${clients.phone}, '') like ${term}`,
        sql`coalesce(${clients.mobile}, '') like ${term}`,
      );
      if (search) filters.push(search);
    }
    const where = and(...filters);

    const sortColumn =
      query.sortBy === "name" ? clients.name : query.sortBy === "code" ? clients.code : clients.createdAt;
    const orderBy = query.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [rows, [countRow]] = await Promise.all([
      db.select().from(clients).where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(clients).where(where),
    ]);

    return {
      items: rows.map((row) => serializeClient(row)),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async get(ctx: Ctx, id: string) {
    return serializeClient(await this.require(ctx, id));
  }

  async stats(ctx: Ctx, id: string) {
    await this.require(ctx, id);
    const db = getDb();
    const [row] = await db
      .select({
        totalInvoices: sql<number>`count(*)::int`,
        totalSpent: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        totalPaid: sql<number>`coalesce(sum(${invoices.paidMinor}), 0)::bigint`,
        totalDue: sql<number>`coalesce(sum(${invoices.dueMinor}), 0)::bigint`,
        lastInvoiceDate: sql<string | null>`max(${invoices.issueDate})`,
      })
      .from(invoices)
      .where(and(eq(invoices.tenantId, ctx.tenantId), eq(invoices.clientId, id), isNull(invoices.deletedAt)));

    const totalInvoices = Number(row?.totalInvoices ?? 0);
    const totalSpentMinor = Number(row?.totalSpent ?? 0);
    return {
      totalInvoices,
      totalSpent: fromMinor(totalSpentMinor),
      totalPaid: fromMinor(Number(row?.totalPaid ?? 0)),
      totalDue: fromMinor(Number(row?.totalDue ?? 0)),
      lastInvoiceDate: row?.lastInvoiceDate ?? null,
      averageInvoice: totalInvoices ? fromMinor(Math.round(totalSpentMinor / totalInvoices)) : 0,
    };
  }

  async invoices(ctx: Ctx, id: string) {
    await this.require(ctx, id);
    const db = getDb();
    const rows = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.tenantId, ctx.tenantId), eq(invoices.clientId, id), isNull(invoices.deletedAt)))
      .orderBy(desc(invoices.issueDate))
      .limit(100);
    return rows.map((invoice) => ({
      _id: invoice.id,
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: fromMinor(Number(invoice.totalMinor)),
      paid: fromMinor(Number(invoice.paidMinor)),
      due: fromMinor(Number(invoice.dueMinor)),
      currency: invoice.currency,
      createdAt: invoice.createdAt.toISOString(),
    }));
  }

  async create(ctx: Ctx, input: CreateClientInput) {
    const db = getDb();
    const code = input.code.trim();
    await this.assertCodeFree(ctx.tenantId, code);
    if (input.email) await this.assertEmailFree(ctx.tenantId, input.email);

    const id = newId();
    await db.insert(clients).values({
      id,
      tenantId: ctx.tenantId,
      code,
      name: input.name.trim(),
      type: input.type,
      category: input.category,
      email: input.email ?? null,
      phone: input.phone ?? null,
      mobile: input.mobile ?? null,
      taxNumber: input.taxNumber ?? null,
      commercialRegistration: input.commercialRegistration ?? null,
      contactPerson: input.contactPerson ?? null,
      notes: input.notes ?? null,
      address: cleanAddress(input.address),
      billingAddress: cleanAddress(input.billingAddress),
      balanceMinor: toMinor(input.balance ?? 0),
      creditLimitMinor: toMinor(input.creditLimit ?? 0),
      paymentTerms: input.paymentTerms,
      isActive: input.isActive,
      createdBy: ctx.userId,
    });

    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "client.created",
      entity: "client",
      entityId: id,
      after: { code, name: input.name },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.get(ctx, id);
  }

  async update(ctx: Ctx, id: string, input: UpdateClientInput) {
    const db = getDb();
    const existing = await this.require(ctx, id);

    if (input.code && input.code.trim().toLowerCase() !== existing.code.toLowerCase()) {
      await this.assertCodeFree(ctx.tenantId, input.code.trim(), id);
    }
    if (input.email && input.email.toLowerCase() !== (existing.email ?? "").toLowerCase()) {
      await this.assertEmailFree(ctx.tenantId, input.email, id);
    }

    const patch: Partial<typeof clients.$inferInsert> = { updatedAt: new Date() };
    if (input.code !== undefined) patch.code = input.code.trim();
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.type !== undefined) patch.type = input.type;
    if (input.category !== undefined) patch.category = input.category;
    if (input.email !== undefined) patch.email = input.email ?? null;
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.mobile !== undefined) patch.mobile = input.mobile ?? null;
    if (input.taxNumber !== undefined) patch.taxNumber = input.taxNumber ?? null;
    if (input.commercialRegistration !== undefined) patch.commercialRegistration = input.commercialRegistration ?? null;
    if (input.contactPerson !== undefined) patch.contactPerson = input.contactPerson ?? null;
    if (input.notes !== undefined) patch.notes = input.notes ?? null;
    if (input.address !== undefined) patch.address = cleanAddress(input.address);
    if (input.billingAddress !== undefined) patch.billingAddress = cleanAddress(input.billingAddress);
    if (input.balance !== undefined) patch.balanceMinor = toMinor(input.balance);
    if (input.creditLimit !== undefined) patch.creditLimitMinor = toMinor(input.creditLimit);
    if (input.paymentTerms !== undefined) patch.paymentTerms = input.paymentTerms;
    if (input.isActive !== undefined) patch.isActive = input.isActive;

    await db.update(clients).set(patch).where(and(eq(clients.id, id), eq(clients.tenantId, ctx.tenantId)));
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "client.updated",
      entity: "client",
      entityId: id,
      before: { code: existing.code, name: existing.name, balance: fromMinor(Number(existing.balanceMinor)) },
      after: input,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.get(ctx, id);
  }

  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    const existing = await this.require(ctx, id);
    const [openInvoice] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, ctx.tenantId),
          eq(invoices.clientId, id),
          isNull(invoices.deletedAt),
          sql`${invoices.status} in ('sent','partially_paid','overdue')`,
        ),
      )
      .limit(1);
    if (openInvoice) {
      throw AppError.unprocessable("CLIENT_HAS_OPEN_INVOICES", "Ce client a des factures impayées et ne peut pas être supprimé.");
    }

    await db
      .update(clients)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.tenantId, ctx.tenantId)));
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "client.deleted",
      entity: "client",
      entityId: id,
      before: { code: existing.code, name: existing.name },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { success: true };
  }

  async checkCode(ctx: Ctx, code: string, clientId?: string) {
    const db = getDb();
    const filters: SQL[] = [eq(clients.tenantId, ctx.tenantId), sql`lower(${clients.code}) = ${code.trim().toLowerCase()}`, isNull(clients.deletedAt)];
    if (clientId) filters.push(sql`${clients.id} <> ${clientId}`);
    const [row] = await db.select({ id: clients.id }).from(clients).where(and(...filters)).limit(1);
    return row ? { available: false, error: "Ce code client est déjà utilisé" } : { available: true };
  }

  async checkEmail(ctx: Ctx, email: string, clientId?: string) {
    const db = getDb();
    const filters: SQL[] = [eq(clients.tenantId, ctx.tenantId), sql`lower(${clients.email}) = ${email.trim().toLowerCase()}`, isNull(clients.deletedAt)];
    if (clientId) filters.push(sql`${clients.id} <> ${clientId}`);
    const [row] = await db.select({ id: clients.id }).from(clients).where(and(...filters)).limit(1);
    return row ? { available: false, error: "Cet email est déjà utilisé" } : { available: true };
  }

  private async require(ctx: Ctx, id: string): Promise<ClientRow> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.tenantId, ctx.tenantId), isNull(clients.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Client introuvable");
    return row;
  }

  private async assertCodeFree(tenantId: string, code: string, exceptId?: string) {
    const db = getDb();
    const filters: SQL[] = [eq(clients.tenantId, tenantId), sql`lower(${clients.code}) = ${code.toLowerCase()}`, isNull(clients.deletedAt)];
    if (exceptId) filters.push(sql`${clients.id} <> ${exceptId}`);
    const [row] = await db.select({ id: clients.id }).from(clients).where(and(...filters)).limit(1);
    if (row) throw AppError.conflict("CLIENT_CODE_EXISTS", "Ce code client est déjà utilisé");
  }

  private async assertEmailFree(tenantId: string, email: string, exceptId?: string) {
    const db = getDb();
    const filters: SQL[] = [eq(clients.tenantId, tenantId), sql`lower(${clients.email}) = ${email.toLowerCase()}`, isNull(clients.deletedAt)];
    if (exceptId) filters.push(sql`${clients.id} <> ${exceptId}`);
    const [row] = await db.select({ id: clients.id }).from(clients).where(and(...filters)).limit(1);
    if (row) throw AppError.conflict("CLIENT_EMAIL_EXISTS", "Cet email est déjà utilisé par un autre client");
  }
}
