import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, gt, gte, isNull, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import PDFDocument from "pdfkit";
import type { Response } from "express";
import { getDb } from "../../db/client";
import {
  clients,
  invoiceItems,
  invoicePublicTokens,
  invoiceStatusHistory,
  invoices,
  notifications,
  outboxEvents,
  payments,
  tenantSettings,
  tenants,
} from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate, type Pagination } from "../../shared/http";
import {
  MoneyError,
  fromMinor,
  invoiceTotals,
  percentToBp,
  toMinor,
  toMinorStrict,
  type InvoiceTotals as Totals,
  type LineAmounts,
} from "../../shared/money";
import { documentNumber } from "../../shared/numbering";
import { hashToken } from "../../shared/security/tokens";
import { PaymentsService } from "../payments/payments.service";
import type { CreateInvoiceInput, InvoiceItemInput, SendInvoiceInput, UpdateInvoiceInput } from "./invoices.dto";

/** Public links are short-lived by default and capped so they cannot be eternal. */
export const PUBLIC_LINK_MIN_DAYS = 1;
export const PUBLIC_LINK_MAX_DAYS = 90;
export const PUBLIC_LINK_DEFAULT_DAYS = 30;

function clampDays(days: number | undefined): number {
  if (!Number.isFinite(days ?? Number.NaN)) return PUBLIC_LINK_DEFAULT_DAYS;
  return Math.min(PUBLIC_LINK_MAX_DAYS, Math.max(PUBLIC_LINK_MIN_DAYS, Math.trunc(days as number)));
}

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

type ListQuery = {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  clientId?: string;
  fromDate?: string;
  toDate?: string;
  dueFrom?: string;
  dueTo?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: string;
  sortOrder?: string;
};

type InvoiceRow = {
  invoice: typeof invoices.$inferSelect;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  clientCode: string | null;
};

function ymd(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

/**
 * Adapts validated DTOs to the single money implementation in
 * `shared/money.ts`. Percentages are converted to basis points exactly once,
 * here, and invalid precision is rejected with a field-level 400 rather than
 * being silently rounded.
 */
function computeInvoiceTotals(input: {
  items: InvoiceItemInput[];
  discount?: number;
  shipping?: number;
}): Totals {
  try {
    return invoiceTotals({
      items: input.items.map((item, index) => ({
        quantity: item.quantity,
        unitPriceMinor: toMinorStrict(item.unitPrice, `items[${index}].unitPrice`),
        discountBp: percentToBp(item.discount, `items[${index}].discount`),
        taxRateBp: percentToBp(item.taxRate, `items[${index}].taxRate`),
      })),
      globalDiscountMinor: toMinorStrict(input.discount ?? 0, "discount"),
      shippingMinor: toMinorStrict(input.shipping ?? 0, "shipping"),
    });
  } catch (error) {
    if (error instanceof MoneyError) {
      throw AppError.badRequest(error.message, [{ field: error.field, message: error.message }]);
    }
    throw error;
  }
}

/** Line input paired with its computed amounts, in insertion order. */
type ComputedLine = { input: InvoiceItemInput; amounts: LineAmounts };

function computeLines(items: InvoiceItemInput[], discount: number, shipping: number) {
  const totals = computeInvoiceTotals({ items, discount, shipping });
  return {
    lines: totals.lines.map((amounts, index) => ({ input: items[index]!, amounts })),
    totals,
  };
}

@Injectable()
export class InvoicesService {
  constructor(private readonly payments: PaymentsService) {}

  /* -------------------------------- reads ----------------------------- */

  async list(ctx: Ctx, query: ListQuery): Promise<{ items: Array<ReturnType<InvoicesService["serialize"]>>; pagination: Pagination }> {
    await this.markOverdue(ctx.tenantId);
    const db = getDb();
    const filters = this.filters(ctx, query);
    const where = and(...filters);
    const sort = this.sortColumn(query.sortBy);
    const orderBy = query.sortOrder === "asc" ? asc(sort) : desc(sort);

    const base = db
      .select({
        invoice: invoices,
        clientName: clients.name,
        clientEmail: clients.email,
        clientPhone: clients.phone,
        clientCode: clients.code,
      })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId));

    const [rows, [countRow]] = await Promise.all([
      base.where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(invoices).leftJoin(clients, eq(clients.id, invoices.clientId)).where(where),
    ]);

    const ids = rows.map((row) => row.invoice.id);
    const itemCounts = ids.length
      ? await db
          .select({ invoiceId: invoiceItems.invoiceId, count: sql<number>`count(*)::int` })
          .from(invoiceItems)
          .where(sql`${invoiceItems.invoiceId} in ${ids}`)
          .groupBy(invoiceItems.invoiceId)
      : [];
    const countMap = new Map(itemCounts.map((row) => [row.invoiceId, Number(row.count)]));

    return {
      items: (rows as InvoiceRow[]).map((row) => this.serialize(row, [], countMap.get(row.invoice.id) ?? 0)),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async overdue(ctx: Ctx, limit: number) {
    await this.markOverdue(ctx.tenantId);
    const db = getDb();
    const rows = await db
      .select({ invoice: invoices, clientName: clients.name, clientEmail: clients.email, clientPhone: clients.phone, clientCode: clients.code })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), eq(invoices.status, "overdue")))
      .orderBy(asc(invoices.dueDate))
      .limit(Math.min(200, Math.max(1, limit)));
    return (rows as InvoiceRow[]).map((row) => this.serialize(row, [], 0));
  }

  async byClient(ctx: Ctx, clientId: string, query: { page: number; limit: number; offset: number; status?: string }) {
    return this.list(ctx, { ...query, clientId });
  }

  async get(ctx: Ctx, id: string) {
    await this.markOverdue(ctx.tenantId);
    const db = getDb();
    const [row] = await db
      .select({ invoice: invoices, clientName: clients.name, clientEmail: clients.email, clientPhone: clients.phone, clientCode: clients.code })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Facture introuvable");

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.position));
    const paymentRows = await db
      .select()
      .from(payments)
      .where(and(eq(payments.invoiceId, id), eq(payments.tenantId, ctx.tenantId)))
      .orderBy(desc(payments.paidAt));

    return {
      ...this.serialize(row as InvoiceRow, items, items.length),
      payments: paymentRows.map((payment) => ({
        _id: payment.id,
        id: payment.id,
        paymentNumber: payment.number,
        amount: fromMinor(Number(payment.amountMinor)),
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt.toISOString(),
        reference: payment.reference,
      })),
    };
  }

  /* --------------------------- public links --------------------------- */

  /**
   * Mints a shareable link for an invoice.
   *
   * The raw token is returned exactly once and only its SHA-256 hash is stored,
   * so a database leak does not yield working links. Links expire and can be
   * revoked (see `revokePublicLinks`).
   */
  async createPublicLink(ctx: Ctx, id: string, input: { expiresInDays?: number }) {
    const db = getDb();
    const invoice = await this.requireInvoice(ctx.tenantId, id);
    if (invoice.status === "draft") {
      throw AppError.unprocessable("INVOICE_NOT_PUBLISHED", "Un brouillon ne peut pas être publié.");
    }

    const days = clampDays(input.expiresInDays);
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const tokenId = newId();

    await db.insert(invoicePublicTokens).values({
      id: tokenId,
      invoiceId: invoice.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "invoice.public_link_created",
      entity: "invoice",
      entityId: invoice.id,
      after: { tokenId, expiresAt: expiresAt.toISOString(), days },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      id: tokenId,
      token,
      expiresAt: expiresAt.toISOString(),
      // The frontend route that consumes the token.
      url: `/invoices/public/${token}`,
    };
  }

  /** Revokes every active public link for an invoice. Returns how many were revoked. */
  async revokePublicLinks(ctx: Ctx, id: string) {
    const db = getDb();
    // `requireInvoice` scopes to the tenant, so another tenant's invoice is a 404.
    const invoice = await this.requireInvoice(ctx.tenantId, id);
    const revoked = await db
      .update(invoicePublicTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(invoicePublicTokens.invoiceId, invoice.id), isNull(invoicePublicTokens.revokedAt)))
      .returning({ id: invoicePublicTokens.id });

    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "invoice.public_link_revoked",
      entity: "invoice",
      entityId: invoice.id,
      after: { revoked: revoked.length },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { revoked: revoked.length };
  }

  /**
   * RLS SEAM — resolves a public token to an invoice WITHOUT a tenant context.
   *
   * This is the single query in the codebase that must read tenant-scoped data
   * while no `app.tenant_id` is known, because the token *is* the only
   * credential. When Row-Level Security lands (Sprint 1b) this method must run
   * under the narrowest possible role: a policy that grants SELECT on exactly
   * `invoice_public_tokens`, `invoices`, `invoice_items`, `clients` and
   * `tenants`, restricted to the row the presented token identifies, and that
   * grants nothing else. Everything downstream of here works with a resolved
   * `tenantId`.
   *
   * Returns null for unknown, expired and revoked tokens alike so callers
   * cannot distinguish "never existed" from "revoked" (no oracle).
   */
  async resolvePublicToken(token: string): Promise<{ invoiceId: string; tenantId: string } | null> {
    if (!token || token.length > 128) return null;
    const db = getDb();
    const now = new Date();

    const [row] = await db
      .select({ invoiceId: invoicePublicTokens.invoiceId })
      .from(invoicePublicTokens)
      .where(
        and(
          eq(invoicePublicTokens.tokenHash, hashToken(token)),
          isNull(invoicePublicTokens.revokedAt),
          gt(invoicePublicTokens.expiresAt, now),
        ),
      )
      .limit(1);
    if (!row) return null;

    // The invoice may have been soft-deleted after the link was minted.
    const [invoice] = await db
      .select({ id: invoices.id, tenantId: invoices.tenantId, status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.id, row.invoiceId), isNull(invoices.deletedAt)))
      .limit(1);
    if (!invoice || invoice.status === "draft") return null;

    return { invoiceId: invoice.id, tenantId: invoice.tenantId };
  }

  /** Public document view resolved from a token (no authentication). */
  async publicViewByToken(token: string) {
    const resolved = await this.resolvePublicToken(token);
    if (!resolved) throw AppError.notFound("Document introuvable ou lien expiré");

    const db = getDb();
    const [row] = await db
      .select({ invoice: invoices, clientName: clients.name, clientEmail: clients.email, clientPhone: clients.phone, clientCode: clients.code })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      // The tenantId predicate is derived from the token, never from the caller.
      .where(and(eq(invoices.id, resolved.invoiceId), eq(invoices.tenantId, resolved.tenantId), isNull(invoices.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Document introuvable ou lien expiré");

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, resolved.tenantId)).limit(1);
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, resolved.invoiceId))
      .orderBy(asc(invoiceItems.position));

    return {
      invoice: this.serialize(row as InvoiceRow, items, items.length),
      company: tenant
        ? {
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone,
            address: tenant.address,
            city: tenant.city,
            country: tenant.country,
            taxNumber: tenant.taxNumber,
            logo: tenant.logoUrl,
          }
        : null,
    };
  }

  async stats(ctx: Ctx, period = "month") {
    const db = getDb();
    await this.markOverdue(ctx.tenantId);
    const since = this.periodStart(period);
    const base = and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), gte(invoices.issueDate, since));

    const [summary] = await db
      .select({
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        paid: sql<number>`coalesce(sum(${invoices.paidMinor}), 0)::bigint`,
        due: sql<number>`coalesce(sum(${invoices.dueMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
        overdueCount: sql<number>`coalesce(sum(case when ${invoices.status} = 'overdue' then 1 else 0 end), 0)::int`,
        overdueAmount: sql<number>`coalesce(sum(case when ${invoices.status} = 'overdue' then ${invoices.dueMinor} else 0 end), 0)::bigint`,
      })
      .from(invoices)
      .where(and(base, sql`${invoices.status} not in ('draft','cancelled')`));

    const byStatus = await db
      .select({ status: invoices.status, count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint` })
      .from(invoices)
      .where(and(base, sql`${invoices.status} not in ('draft','cancelled')`))
      .groupBy(invoices.status);

    const topClients = await db
      .select({
        clientId: invoices.clientId,
        name: clients.name,
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(base, sql`${invoices.status} not in ('draft','cancelled')`))
      .groupBy(invoices.clientId, clients.name)
      .orderBy(desc(sql`sum(${invoices.totalMinor})`))
      .limit(5);

    const monthly = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${invoices.issueDate}), 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        paid: sql<number>`coalesce(sum(${invoices.paidMinor}), 0)::bigint`,
      })
      .from(invoices)
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), sql`${invoices.status} not in ('draft','cancelled')`))
      .groupBy(sql`date_trunc('month', ${invoices.issueDate})`)
      .orderBy(sql`date_trunc('month', ${invoices.issueDate})`);

    return {
      summary: {
        total: fromMinor(Number(summary?.total ?? 0)),
        paid: fromMinor(Number(summary?.paid ?? 0)),
        due: fromMinor(Number(summary?.due ?? 0)),
        count: Number(summary?.count ?? 0),
        overdueCount: Number(summary?.overdueCount ?? 0),
        overdueAmount: fromMinor(Number(summary?.overdueAmount ?? 0)),
      },
      byStatus: byStatus.map((row) => ({ status: row.status, count: Number(row.count), total: fromMinor(Number(row.total)) })),
      topClients: topClients.map((row) => ({ clientId: row.clientId, name: row.name ?? "—", total: fromMinor(Number(row.total)), count: Number(row.count) })),
      monthly: monthly.map((row) => ({ month: row.month, total: fromMinor(Number(row.total)), paid: fromMinor(Number(row.paid)) })),
      period: { type: period, from: since },
    };
  }

  /* ------------------------------- writes ----------------------------- */

  async create(ctx: Ctx, input: CreateInvoiceInput) {
    const db = getDb();
    const client = await this.requireClient(ctx.tenantId, input.clientId);
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, ctx.tenantId)).limit(1);

    const issueDate = input.date ? ymd(input.date) : ymd(new Date());
    const dueDate = ymd(input.dueDate);
    if (dueDate < issueDate) throw AppError.badRequest("La date d'échéance doit être postérieure à la date d'émission");

    // Single money implementation: VAT is charged on the net (post-discount) base.
    const { lines, totals } = computeLines(input.items, input.discount ?? 0, input.shipping ?? 0);
    const subtotalMinor = totals.subtotalMinor;
    const globalDiscountMinor = totals.globalDiscountMinor;
    const shippingMinor = toMinorStrict(input.shipping ?? 0, "shipping");
    const taxMinor = totals.taxMinor;
    const totalMinor = totals.totalMinor;

    const id = newId();
    const number = await documentNumber(ctx.tenantId, "invoice", settings?.invoicePrefix?.replace(/-$/, "") || "FA");
    const status = input.status && input.status !== "paid" ? input.status : "sent";

    await db.transaction(async (tx) => {
      await tx.insert(invoices).values({
        id,
        tenantId: ctx.tenantId,
        number,
        clientId: client.id,
        status,
        issueDate,
        dueDate,
        currency: input.currency ?? clientCurrencyFallback(),
        subtotalMinor,
        discountMinor: globalDiscountMinor,
        shippingMinor,
        taxMinor,
        totalMinor,
        paidMinor: 0,
        dueMinor: totalMinor,
        notes: input.notes ?? null,
        terms: input.terms ?? null,
        issuedAt: status === "draft" ? null : new Date(),
        createdBy: ctx.userId,
      });
      await tx.insert(invoiceItems).values(
        lines.map((line, index) => ({
          id: newId(),
          invoiceId: id,
          position: index + 1,
          productId: line.input.productId ?? null,
          description: line.input.description,
          quantity: String(line.input.quantity),
          unitPriceMinor: toMinorStrict(line.input.unitPrice, `items[${index}].unitPrice`),
          discountBp: percentToBp(line.input.discount, "discount"),
          taxRateBp: percentToBp(line.input.taxRate, "taxRate"),
          taxMinor: line.amounts.taxMinor,
          lineTotalMinor: line.amounts.totalMinor,
        })),
      );
      await tx.insert(invoiceStatusHistory).values({
        id: newId(),
        invoiceId: id,
        fromStatus: null,
        toStatus: status,
        actorId: ctx.userId,
        reason: "Création",
      });
    });

    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "invoice.created", entity: "invoice", entityId: id, after: { number, total: fromMinor(totalMinor) }, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async update(ctx: Ctx, id: string, input: UpdateInvoiceInput) {
    const db = getDb();
    const existing = await this.requireInvoice(ctx.tenantId, id);

    const patch: Partial<typeof invoices.$inferInsert> = { updatedAt: new Date() };
    let totals: { subtotalMinor: number; taxMinor: number; totalMinor: number } | null = null;
    let lines: ComputedLine[] | null = null;

    if (input.clientId && input.clientId !== existing.clientId) {
      await this.requireClient(ctx.tenantId, input.clientId);
      patch.clientId = input.clientId;
    }
    if (input.date !== undefined) patch.issueDate = ymd(input.date);
    if (input.dueDate !== undefined) patch.dueDate = ymd(input.dueDate);
    if (input.notes !== undefined) patch.notes = input.notes ?? null;
    if (input.terms !== undefined) patch.terms = input.terms ?? null;

    if (input.items) {
      if (Number(existing.paidMinor) > 0) throw AppError.conflict("INVOICE_HAS_PAYMENTS", "Une facture partiellement payée ne peut pas être modifiée.");
      const discountInput = input.discount ?? fromMinor(Number(existing.discountMinor));
      const shippingInput = input.shipping ?? fromMinor(Number(existing.shippingMinor));
      const computed = computeLines(input.items, discountInput, shippingInput);
      const { totals: newTotals } = computed;
      const totalMinor = newTotals.totalMinor;
      // Preserve the amount already collected: only the outstanding balance moves.
      const paidMinor = Number(existing.paidMinor);
      if (totalMinor < paidMinor) {
        throw AppError.conflict("INVOICE_BELOW_PAID_AMOUNT", "Le nouveau total est inférieur aux paiements déjà encaissés.");
      }
      patch.subtotalMinor = newTotals.subtotalMinor;
      patch.taxMinor = newTotals.taxMinor;
      patch.discountMinor = newTotals.globalDiscountMinor;
      patch.shippingMinor = toMinorStrict(shippingInput, "shipping");
      patch.totalMinor = totalMinor;
      patch.paidMinor = paidMinor;
      patch.dueMinor = totalMinor - paidMinor;
      lines = computed.lines;
      totals = { subtotalMinor: newTotals.subtotalMinor, taxMinor: newTotals.taxMinor, totalMinor };
    }

    const nextIssue = (patch.issueDate as string | undefined) ?? existing.issueDate;
    const nextDue = (patch.dueDate as string | undefined) ?? existing.dueDate;
    if (nextDue < nextIssue) throw AppError.badRequest("La date d'échéance doit être postérieure à la date d'émission");

    await db.transaction(async (tx) => {
      await tx.update(invoices).set(patch).where(and(eq(invoices.id, id), eq(invoices.tenantId, ctx.tenantId)));
      if (lines) {
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        await tx.insert(invoiceItems).values(
          lines.map((line, index) => ({
            id: newId(),
            invoiceId: id,
            position: index + 1,
            productId: line.input.productId ?? null,
            description: line.input.description,
            quantity: String(line.input.quantity),
            unitPriceMinor: toMinorStrict(line.input.unitPrice, `items[${index}].unitPrice`),
            discountBp: percentToBp(line.input.discount, "discount"),
            taxRateBp: percentToBp(line.input.taxRate, "taxRate"),
            taxMinor: line.amounts.taxMinor,
            lineTotalMinor: line.amounts.totalMinor,
          })),
        );
      }
    });

    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "invoice.updated", entity: "invoice", entityId: id, after: totals ?? input, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async updateStatus(ctx: Ctx, id: string, status: string) {
    const db = getDb();
    const existing = await this.requireInvoice(ctx.tenantId, id);
    if (existing.status === status) return this.get(ctx, id);
    if (existing.status === "paid" && status !== "cancelled") {
      throw AppError.conflict("INVALID_STATUS_TRANSITION", "Une facture payée ne peut plus changer d'état.");
    }
    if (status === "paid") {
      const dueMinor = Number(existing.dueMinor);
      if (dueMinor > 0) {
        await this.payments.create(ctx, {
          invoiceId: id,
          amount: fromMinor(dueMinor),
          method: "CASH",
          notes: "Encaissement manuel",
        });
        return this.get(ctx, id);
      }
    }
    if (status === "cancelled" && Number(existing.paidMinor) > 0) {
      throw AppError.conflict("INVOICE_HAS_PAYMENTS", "Remboursez les paiements avant d'annuler la facture.");
    }
    if (status === "draft" || status === "sent" || status === "partially_paid" || status === "overdue") {
      if (status === "partially_paid" && Number(existing.paidMinor) === 0) {
        throw AppError.conflict("INVALID_STATUS_TRANSITION", "Aucun paiement enregistré sur cette facture.");
      }
      if (status === "overdue" && existing.dueDate >= ymd(new Date())) {
        throw AppError.conflict("INVALID_STATUS_TRANSITION", "L'échéance n'est pas encore dépassée.");
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({
          status,
          issuedAt: status === "sent" && !existing.issuedAt ? new Date() : existing.issuedAt,
          cancelledAt: status === "cancelled" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id));
      await tx.insert(invoiceStatusHistory).values({
        id: newId(),
        invoiceId: id,
        fromStatus: existing.status,
        toStatus: status,
        actorId: ctx.userId,
        reason: "Changement manuel",
      });
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "invoice.status_changed", entity: "invoice", entityId: id, before: { status: existing.status }, after: { status }, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async duplicate(ctx: Ctx, id: string) {
    const source = await this.get(ctx, id);
    return this.create(ctx, {
      clientId: source.clientId._id,
      date: ymd(new Date()),
      dueDate: ymd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      items: source.items.map((item) => ({
        productId: item.productId ?? null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
      discount: source.discount,
      shipping: source.shipping,
      notes: source.notes ?? null,
      terms: source.terms ?? null,
      status: "draft",
    });
  }

  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    const existing = await this.requireInvoice(ctx.tenantId, id);
    if (Number(existing.paidMinor) > 0) throw AppError.conflict("INVOICE_HAS_PAYMENTS", "Une facture payée ne peut pas être supprimée.");
    await db
      .update(invoices)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, ctx.tenantId)));
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "invoice.deleted", entity: "invoice", entityId: id, before: { number: existing.number }, ip: ctx.ip, userAgent: ctx.userAgent });
    return { success: true };
  }

  async send(ctx: Ctx, id: string, input: SendInvoiceInput) {
    const db = getDb();
    const invoice = await this.requireInvoice(ctx.tenantId, id);
    if (invoice.status === "draft") {
      await this.updateStatus(ctx, id, "sent");
    }
    const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
    await db.insert(outboxEvents).values({
      id: newId(),
      tenantId: ctx.tenantId,
      type: "invoice.send",
      payload: {
        invoiceId: id,
        to: input.email ?? client?.email ?? null,
        message: input.message ?? null,
        invoiceNumber: invoice.number,
        sendEmail: input.sendEmail ?? true,
      },
      status: "pending",
    });
    await db.insert(notifications).values({
      id: newId(),
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type: "info",
      title: "Facture envoyée",
      message: `La facture ${invoice.number} a été mise en file d'envoi.`,
      data: { invoiceId: id },
      priority: "low",
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "invoice.sent", entity: "invoice", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { success: true, message: "Facture mise en file d'envoi", delivery: "queued" };
  }

  /* -------------------------------- PDF ------------------------------- */

  /** Public PDF download: the token, not the invoice id, authorises the read. */
  async streamPdfByPublicToken(token: string, res: Response): Promise<void> {
    const resolved = await this.resolvePublicToken(token);
    if (!resolved) throw AppError.notFound("Document introuvable ou lien expiré");
    await this.streamPdf(resolved.invoiceId, resolved.tenantId, res);
  }

  /**
   * Streams the invoice PDF.
   *
   * `tenantId` is REQUIRED: there is no anonymous-by-id path any more. Public
   * downloads resolve a token to a tenant first (see `streamPdfByPublicToken`)
   * and then call this, so the tenant predicate is always present.
   */
  async streamPdf(id: string, tenantId: string, res: Response): Promise<void> {
    const db = getDb();
    const filters: SQL[] = [eq(invoices.id, id), eq(invoices.tenantId, tenantId), isNull(invoices.deletedAt)];
    const [row] = await db
      .select({ invoice: invoices, clientName: clients.name })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(...filters))
      .limit(1);
    if (!row) throw AppError.notFound("Facture introuvable");
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.position));
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, row.invoice.tenantId)).limit(1);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${row.invoice.number}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text(tenant?.name ?? "Facture", { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#555").text(tenant?.email ?? "", { continued: false });
    if (tenant?.address) doc.text(`${tenant.address}${tenant.city ? `, ${tenant.city}` : ""}`);
    if (tenant?.taxNumber) doc.text(`NIF: ${tenant.taxNumber}`);
    doc.moveDown(1);

    doc.fillColor("#000").fontSize(16).text(`Facture ${row.invoice.number}`);
    doc.fontSize(10).text(`Client: ${row.clientName ?? "—"}`);
    doc.text(`Date d'émission: ${row.invoice.issueDate}`);
    doc.text(`Échéance: ${row.invoice.dueDate}`);
    doc.text(`Statut: ${row.invoice.status}`);
    doc.moveDown(1);

    const left = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columns = [left, left + width * 0.45, left + width * 0.6, left + width * 0.72, left + width * 0.85];
    doc.fontSize(9).fillColor("#333");
    doc.text("Description", columns[0], doc.y, { width: width * 0.42 });
    doc.text("Qté", columns[1], doc.y, { width: width * 0.12 });
    doc.text("P.U.", columns[2], doc.y, { width: width * 0.12 });
    doc.text("TVA", columns[3], doc.y, { width: width * 0.1 });
    doc.text("Total", columns[4], doc.y, { width: width * 0.15 });
    doc.moveDown(0.4);
    doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.4);

    for (const item of items) {
      const y = doc.y;
      doc.fillColor("#000").fontSize(9).text(item.description, columns[0], y, { width: width * 0.42 });
      doc.text(formatQty(Number(item.quantity)), columns[1], y, { width: width * 0.12 });
      doc.text(fromMinor(Number(item.unitPriceMinor)).toFixed(2), columns[2], y, { width: width * 0.12 });
      doc.text(`${Number(item.taxRateBp) / 100}%`, columns[3], y, { width: width * 0.1 });
      doc.text(fromMinor(Number(item.lineTotalMinor)).toFixed(2), columns[4], y, { width: width * 0.15 });
      doc.moveDown(0.8);
    }

    doc.moveDown(0.5);
    const totalsX = left + width * 0.6;
    doc.fontSize(10).text(`Sous-total: ${fromMinor(Number(row.invoice.subtotalMinor)).toFixed(2)}`, totalsX, doc.y, { width: width * 0.4, align: "right" });
    doc.text(`TVA: ${fromMinor(Number(row.invoice.taxMinor)).toFixed(2)}`, totalsX, doc.y, { width: width * 0.4, align: "right" });
    if (Number(row.invoice.discountMinor) > 0) doc.text(`Remise: -${fromMinor(Number(row.invoice.discountMinor)).toFixed(2)}`, totalsX, doc.y, { width: width * 0.4, align: "right" });
    if (Number(row.invoice.shippingMinor) > 0) doc.text(`Livraison: ${fromMinor(Number(row.invoice.shippingMinor)).toFixed(2)}`, totalsX, doc.y, { width: width * 0.4, align: "right" });
    doc.fontSize(12).text(`Total: ${fromMinor(Number(row.invoice.totalMinor)).toFixed(2)} ${row.invoice.currency}`, totalsX, doc.y, { width: width * 0.4, align: "right" });
    doc.fontSize(10).text(`Payé: ${fromMinor(Number(row.invoice.paidMinor)).toFixed(2)}`, totalsX, doc.y, { width: width * 0.4, align: "right" });
    doc.text(`Reste dû: ${fromMinor(Number(row.invoice.dueMinor)).toFixed(2)}`, totalsX, doc.y, { width: width * 0.4, align: "right" });

    if (row.invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(9).fillColor("#555").text(`Notes: ${row.invoice.notes}`, left, doc.y, { width });
    }
    doc.end();
  }

  /* ------------------------------ internals --------------------------- */

  private serialize(row: InvoiceRow, items: Array<typeof invoiceItems.$inferSelect>, itemsCount: number) {
    const invoice = row.invoice;
    return {
      _id: invoice.id,
      id: invoice.id,
      tenantId: invoice.tenantId,
      invoiceNumber: invoice.number,
      number: invoice.number,
      status: invoice.status,
      date: invoice.issueDate,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      clientId: {
        _id: invoice.clientId,
        id: invoice.clientId,
        name: row.clientName ?? "",
        email: row.clientEmail,
        phone: row.clientPhone,
        code: row.clientCode,
      },
      items: items.map((item) => ({
        _id: item.id,
        id: item.id,
        productId: item.productId,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: fromMinor(Number(item.unitPriceMinor)),
        discount: Number(item.discountBp) / 100,
        taxRate: Number(item.taxRateBp) / 100,
        taxAmount: fromMinor(Number(item.taxMinor)),
        total: fromMinor(Number(item.lineTotalMinor)),
      })),
      itemsCount,
      subtotal: fromMinor(Number(invoice.subtotalMinor)),
      taxAmount: fromMinor(Number(invoice.taxMinor)),
      discount: fromMinor(Number(invoice.discountMinor)),
      shipping: fromMinor(Number(invoice.shippingMinor)),
      total: fromMinor(Number(invoice.totalMinor)),
      paidAmount: fromMinor(Number(invoice.paidMinor)),
      amountPaid: fromMinor(Number(invoice.paidMinor)),
      balance: fromMinor(Number(invoice.dueMinor)),
      dueAmount: fromMinor(Number(invoice.dueMinor)),
      notes: invoice.notes,
      terms: invoice.terms,
      issuedAt: invoice.issuedAt?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  private filters(ctx: Ctx, query: ListQuery): SQL[] {
    const filters: SQL[] = [eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt)];
    if (query.status && query.status !== "all") {
      filters.push(sql`${invoices.status} = ${query.status}`);
    }
    if (query.clientId) filters.push(eq(invoices.clientId, query.clientId));
    if (query.fromDate) filters.push(gte(invoices.issueDate, ymd(query.fromDate)));
    if (query.toDate) filters.push(lte(invoices.issueDate, ymd(query.toDate)));
    if (query.dueFrom) filters.push(gte(invoices.dueDate, ymd(query.dueFrom)));
    if (query.dueTo) filters.push(lte(invoices.dueDate, ymd(query.dueTo)));
    if (query.minAmount) filters.push(gte(invoices.totalMinor, toMinor(Number(query.minAmount))));
    if (query.maxAmount) filters.push(lte(invoices.totalMinor, toMinor(Number(query.maxAmount))));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(
        sql`lower(${invoices.number}) like ${term}`,
        sql`lower(coalesce(${clients.name}, '')) like ${term}`,
        sql`lower(coalesce(${clients.email}, '')) like ${term}`,
      );
      if (search) filters.push(search);
    }
    return filters;
  }

  private sortColumn(sortBy?: string) {
    switch (sortBy) {
      case "dueDate":
        return invoices.dueDate;
      case "total":
        return invoices.totalMinor;
      case "createdAt":
        return invoices.createdAt;
      case "invoiceNumber":
        return invoices.number;
      case "clientName":
        return clients.name;
      default:
        return invoices.issueDate;
    }
  }

  private async markOverdue(tenantId: string): Promise<void> {
    const db = getDb();
    await db
      .update(invoices)
      .set({ status: "overdue", updatedAt: new Date() })
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          isNull(invoices.deletedAt),
          sql`${invoices.status} in ('sent','partially_paid')`,
          sql`${invoices.dueDate} < current_date`,
          sql`${invoices.dueMinor} > 0`,
        ),
      );
  }

  private async requireInvoice(tenantId: string, id: string): Promise<typeof invoices.$inferSelect> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId), isNull(invoices.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Facture introuvable");
    return row;
  }

  private async requireClient(tenantId: string, clientId: string): Promise<typeof clients.$inferSelect> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId), isNull(clients.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Client introuvable");
    return row;
  }

  private periodStart(period: string): string {
    const now = new Date();
    if (period === "day") return ymd(now);
    if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return ymd(start);
    }
    if (period === "quarter") return ymd(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1));
    if (period === "year") return ymd(new Date(now.getFullYear(), 0, 1));
    return ymd(new Date(now.getFullYear(), now.getMonth(), 1));
  }
}

function formatQty(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function clientCurrencyFallback(): string {
  return "DZD";
}
