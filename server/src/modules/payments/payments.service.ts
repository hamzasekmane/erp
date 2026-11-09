import { Injectable } from "@nestjs/common";
import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import {
  clients,
  invoiceStatusHistory,
  invoices,
  paymentAllocations,
  paymentGateways,
  paymentMethods,
  paymentRefunds,
  payments,
} from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate, type Pagination } from "../../shared/http";
import { fromMinor, toMinor } from "../../shared/money";
import { documentNumber } from "../../shared/numbering";
import type { CreatePaymentInput, GatewayInput, RefundInput, UpdatePaymentInput } from "./payments.dto";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

type PaymentListQuery = {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  method?: string;
  clientId?: string;
  invoiceId?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: string;
  maxAmount?: string;
};

type PaymentRow = {
  payment: typeof payments.$inferSelect;
  clientName: string | null;
  clientCode: string | null;
  invoiceNumber: string | null;
};

function serializePayment(row: PaymentRow) {
  const p = row.payment;
  return {
    _id: p.id,
    id: p.id,
    tenantId: p.tenantId,
    paymentNumber: p.number,
    transactionId: p.reference,
    amount: fromMinor(Number(p.amountMinor)),
    currency: p.currency,
    method: p.method,
    status: p.status,
    clientId: p.clientId ? { _id: p.clientId, name: row.clientName ?? "", code: row.clientCode ?? undefined } : null,
    clientName: row.clientName ?? undefined,
    invoiceId: p.invoiceId ? { _id: p.invoiceId, invoiceNumber: row.invoiceNumber ?? "" } : null,
    invoiceNumber: row.invoiceNumber ?? undefined,
    reference: p.reference,
    notes: p.notes,
    paidAt: p.paidAt.toISOString(),
    reconciledAt: p.reconciledAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

@Injectable()
export class PaymentsService {
  async list(ctx: Ctx, query: PaymentListQuery): Promise<{ items: ReturnType<typeof serializePayment>[]; pagination: Pagination }> {
    const db = getDb();
    const filters: SQL[] = [eq(payments.tenantId, ctx.tenantId)];
    if (query.status) filters.push(eq(payments.status, query.status.toLowerCase()));
    if (query.method) filters.push(sql`upper(${payments.method}) = ${query.method.toUpperCase()}`);
    if (query.clientId) filters.push(eq(payments.clientId, query.clientId));
    if (query.invoiceId) filters.push(eq(payments.invoiceId, query.invoiceId));
    if (query.fromDate) filters.push(gte(payments.paidAt, new Date(query.fromDate)));
    if (query.toDate) filters.push(lte(payments.paidAt, new Date(query.toDate)));
    if (query.minAmount) filters.push(gte(payments.amountMinor, toMinor(Number(query.minAmount))));
    if (query.maxAmount) filters.push(lte(payments.amountMinor, toMinor(Number(query.maxAmount))));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(
        sql`lower(${payments.number}) like ${term}`,
        sql`lower(coalesce(${payments.reference}, '')) like ${term}`,
        sql`lower(coalesce(${clients.name}, '')) like ${term}`,
        sql`lower(coalesce(${invoices.number}, '')) like ${term}`,
      );
      if (search) filters.push(search);
    }
    const where = and(...filters);

    const base = db
      .select({ payment: payments, clientName: clients.name, clientCode: clients.code, invoiceNumber: invoices.number })
      .from(payments)
      .leftJoin(clients, eq(clients.id, payments.clientId))
      .leftJoin(invoices, eq(invoices.id, payments.invoiceId));

    const [rows, [countRow]] = await Promise.all([
      base.where(where).orderBy(desc(payments.paidAt)).limit(query.limit).offset(query.offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .leftJoin(clients, eq(clients.id, payments.clientId))
        .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
        .where(where),
    ]);

    return {
      items: (rows as PaymentRow[]).map(serializePayment),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async get(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db
      .select({ payment: payments, clientName: clients.name, clientCode: clients.code, invoiceNumber: invoices.number })
      .from(payments)
      .leftJoin(clients, eq(clients.id, payments.clientId))
      .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
      .where(and(eq(payments.id, id), eq(payments.tenantId, ctx.tenantId)))
      .limit(1);
    if (!row) throw AppError.notFound("Paiement introuvable");
    return serializePayment(row as PaymentRow);
  }

  /** Records a payment and allocates it to the invoice, atomically. */
  async create(ctx: Ctx, input: CreatePaymentInput) {
    const db = getDb();
    const amountMinor = toMinor(input.amount);
    if (amountMinor <= 0) throw AppError.badRequest("Le montant doit être supérieur à zéro");

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, input.invoiceId), eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt)))
      .limit(1);
    if (!invoice) throw AppError.notFound("Facture introuvable");
    if (invoice.status === "cancelled") throw AppError.unprocessable("INVOICE_CANCELLED", "Cette facture est annulée.");
    if (invoice.status === "draft") throw AppError.unprocessable("INVOICE_DRAFT", "Émettez la facture avant d'enregistrer un paiement.");
    if (invoice.status === "paid") throw AppError.unprocessable("INVOICE_ALREADY_PAID", "Cette facture est déjà soldée.");

    const dueMinor = Number(invoice.dueMinor);
    if (amountMinor > dueMinor) {
      throw AppError.unprocessable("PAYMENT_EXCEEDS_DUE", "Le montant dépasse le solde restant dû.", {
        due: fromMinor(dueMinor),
        maxPayable: fromMinor(dueMinor),
      });
    }

    const paymentId = newId();
    const number = await documentNumber(ctx.tenantId, "payment", "PAY");
    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    const nextPaid = Number(invoice.paidMinor) + amountMinor;
    const nextDue = Number(invoice.totalMinor) - nextPaid;
    const nextStatus = nextDue <= 0 ? "paid" : "partially_paid";

    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        id: paymentId,
        tenantId: ctx.tenantId,
        number,
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        amountMinor,
        currency: invoice.currency,
        method: input.method.toUpperCase(),
        status: "completed",
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        paidAt,
        createdBy: ctx.userId,
      });
      await tx.insert(paymentAllocations).values({
        id: newId(),
        paymentId,
        invoiceId: invoice.id,
        amountMinor,
      });
      await tx
        .update(invoices)
        .set({ paidMinor: nextPaid, dueMinor: nextDue, status: nextStatus, updatedAt: new Date() })
        .where(eq(invoices.id, invoice.id));
      await tx.insert(invoiceStatusHistory).values({
        id: newId(),
        invoiceId: invoice.id,
        fromStatus: invoice.status,
        toStatus: nextStatus,
        actorId: ctx.userId,
        reason: `Paiement ${number}`,
      });
    });

    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "payment.created",
      entity: "payment",
      entityId: paymentId,
      after: { invoiceId: invoice.id, amount: input.amount, method: input.method },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.get(ctx, paymentId);
  }

  async update(ctx: Ctx, id: string, input: UpdatePaymentInput) {
    const db = getDb();
    const existing = await this.require(ctx, id);
    const patch: Partial<typeof payments.$inferInsert> = { updatedAt: new Date() };
    if (input.method !== undefined) patch.method = input.method.toUpperCase();
    if (input.reference !== undefined) patch.reference = input.reference ?? null;
    if (input.notes !== undefined) patch.notes = input.notes ?? null;
    if (input.status !== undefined) patch.status = input.status;
    await db.update(payments).set(patch).where(and(eq(payments.id, id), eq(payments.tenantId, ctx.tenantId)));
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "payment.updated", entity: "payment", entityId: id, before: { status: existing.status }, after: input, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    const payment = await this.require(ctx, id);
    if (payment.reconciledAt) throw AppError.unprocessable("PAYMENT_RECONCILED", "Un paiement rapproché ne peut pas être supprimé.");
    if (payment.status === "refunded") throw AppError.unprocessable("PAYMENT_REFUNDED", "Un paiement remboursé ne peut pas être supprimé.");

    await db.transaction(async (tx) => {
      const [allocation] = await tx.select().from(paymentAllocations).where(eq(paymentAllocations.paymentId, id)).limit(1);
      if (allocation && payment.invoiceId) {
        const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).limit(1);
        if (invoice) {
          const nextPaid = Math.max(0, Number(invoice.paidMinor) - Number(allocation.amountMinor));
          const nextDue = Number(invoice.totalMinor) - nextPaid;
          await tx
            .update(invoices)
            .set({ paidMinor: nextPaid, dueMinor: nextDue, status: nextPaid === 0 ? "sent" : "partially_paid", updatedAt: new Date() })
            .where(eq(invoices.id, invoice.id));
        }
      }
      await tx.delete(paymentAllocations).where(eq(paymentAllocations.paymentId, id));
      await tx.delete(paymentRefunds).where(eq(paymentRefunds.paymentId, id));
      await tx.delete(payments).where(and(eq(payments.id, id), eq(payments.tenantId, ctx.tenantId)));
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "payment.deleted", entity: "payment", entityId: id, before: { number: payment.number }, ip: ctx.ip, userAgent: ctx.userAgent });
    return { success: true };
  }

  async refund(ctx: Ctx, id: string, input: RefundInput) {
    const db = getDb();
    const payment = await this.require(ctx, id);
    if (payment.status !== "completed") throw AppError.unprocessable("PAYMENT_NOT_REFUNDABLE", "Seul un paiement complété peut être remboursé.");

    const [refundedRow] = await db
      .select({ total: sql<number>`coalesce(sum(${paymentRefunds.amountMinor}), 0)::bigint` })
      .from(paymentRefunds)
      .where(eq(paymentRefunds.paymentId, id));
    const alreadyRefunded = Number(refundedRow?.total ?? 0);
    const amountMinor = toMinor(input.amount);
    if (amountMinor <= 0) throw AppError.badRequest("Montant invalide");
    if (alreadyRefunded + amountMinor > Number(payment.amountMinor)) {
      throw AppError.unprocessable("REFUND_EXCEEDS_PAYMENT", "Le remboursement dépasse le montant du paiement.", {
        refundable: fromMinor(Number(payment.amountMinor) - alreadyRefunded),
      });
    }

    await db.transaction(async (tx) => {
      await tx.insert(paymentRefunds).values({ id: newId(), paymentId: id, amountMinor, reason: input.reason ?? null, createdBy: ctx.userId });
      const fullyRefunded = alreadyRefunded + amountMinor === Number(payment.amountMinor);
      if (fullyRefunded) {
        await tx.update(payments).set({ status: "refunded", updatedAt: new Date() }).where(eq(payments.id, id));
      }
      if (payment.invoiceId) {
        const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).limit(1);
        if (invoice) {
          const nextPaid = Math.max(0, Number(invoice.paidMinor) - amountMinor);
          const nextDue = Number(invoice.totalMinor) - nextPaid;
          await tx
            .update(invoices)
            .set({ paidMinor: nextPaid, dueMinor: nextDue, status: nextPaid === 0 ? "sent" : "partially_paid", updatedAt: new Date() })
            .where(eq(invoices.id, invoice.id));
        }
      }
    });

    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "payment.refunded", entity: "payment", entityId: id, after: { amount: input.amount, reason: input.reason }, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async reconcile(ctx: Ctx, id: string, reconciled: boolean) {
    const db = getDb();
    await this.require(ctx, id);
    await db
      .update(payments)
      .set({ reconciledAt: reconciled ? new Date() : null, reconciledBy: reconciled ? ctx.userId : null, updatedAt: new Date() })
      .where(and(eq(payments.id, id), eq(payments.tenantId, ctx.tenantId)));
    return this.get(ctx, id);
  }

  async stats(ctx: Ctx, period = "month") {
    const db = getDb();
    const days = period === "week" ? 7 : period === "year" ? 365 : period === "day" ? 1 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [summary] = await db
      .select({
        total: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
        reconciled: sql<number>`coalesce(sum(case when ${payments.reconciledAt} is not null then 1 else 0 end), 0)::int`,
      })
      .from(payments)
      .where(and(eq(payments.tenantId, ctx.tenantId), eq(payments.status, "completed"), gte(payments.paidAt, since)));

    const methods = await db
      .select({ method: payments.method, total: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::bigint`, count: sql<number>`count(*)::int` })
      .from(payments)
      .where(and(eq(payments.tenantId, ctx.tenantId), eq(payments.status, "completed"), gte(payments.paidAt, since)))
      .groupBy(payments.method);

    const daily = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${payments.paidAt}), 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(payments)
      .where(and(eq(payments.tenantId, ctx.tenantId), eq(payments.status, "completed"), gte(payments.paidAt, since)))
      .groupBy(sql`date_trunc('day', ${payments.paidAt})`)
      .orderBy(sql`date_trunc('day', ${payments.paidAt})`);

    return {
      summary: {
        total: fromMinor(Number(summary?.total ?? 0)),
        count: Number(summary?.count ?? 0),
        reconciled: Number(summary?.reconciled ?? 0),
        period,
      },
      methods: methods.map((row) => ({ method: row.method, total: fromMinor(Number(row.total)), count: Number(row.count) })),
      daily: daily.map((row) => ({ date: row.date, total: fromMinor(Number(row.total)), count: Number(row.count) })),
    };
  }

  /* ------------------------------ settings ---------------------------- */

  async listGateways(ctx: Ctx) {
    const db = getDb();
    const rows = await db.select().from(paymentGateways).where(eq(paymentGateways.tenantId, ctx.tenantId));
    return rows.map((row) => ({
      _id: row.id,
      id: row.id,
      code: row.code,
      name: row.name,
      isActive: row.isActive,
      config: sanitizeConfig(row.config),
    }));
  }

  async upsertGateway(ctx: Ctx, input: GatewayInput) {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(paymentGateways)
      .where(and(eq(paymentGateways.tenantId, ctx.tenantId), eq(paymentGateways.code, input.code)))
      .limit(1);
    if (existing) {
      await db
        .update(paymentGateways)
        .set({ name: input.name, isActive: input.isActive ?? existing.isActive, config: { ...existing.config, ...(input.config ?? {}) }, updatedAt: new Date() })
        .where(eq(paymentGateways.id, existing.id));
      return this.listGateways(ctx);
    }
    await db.insert(paymentGateways).values({
      id: newId(),
      tenantId: ctx.tenantId,
      code: input.code,
      name: input.name,
      isActive: input.isActive ?? false,
      config: input.config ?? {},
    });
    return this.listGateways(ctx);
  }

  async toggleGateway(ctx: Ctx, id: string, isActive: boolean) {
    const db = getDb();
    await db
      .update(paymentGateways)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(paymentGateways.id, id), eq(paymentGateways.tenantId, ctx.tenantId)));
    return this.listGateways(ctx);
  }

  async listMethods(ctx: Ctx) {
    const db = getDb();
    const rows = await db.select().from(paymentMethods).where(eq(paymentMethods.tenantId, ctx.tenantId));
    return rows.map((row) => ({ _id: row.id, id: row.id, code: row.code, name: row.name, isActive: row.isActive }));
  }

  async toggleMethod(ctx: Ctx, id: string, isActive: boolean) {
    const db = getDb();
    await db
      .update(paymentMethods)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, ctx.tenantId)));
    return this.listMethods(ctx);
  }

  private async require(ctx: Ctx, id: string): Promise<typeof payments.$inferSelect> {
    const db = getDb();
    const [row] = await db.select().from(payments).where(and(eq(payments.id, id), eq(payments.tenantId, ctx.tenantId))).limit(1);
    if (!row) throw AppError.notFound("Paiement introuvable");
    return row;
  }
}

function sanitizeConfig(config: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config ?? {})) {
    result[key] = /secret|key|token|password/i.test(key) ? "********" : value;
  }
  return result;
}
