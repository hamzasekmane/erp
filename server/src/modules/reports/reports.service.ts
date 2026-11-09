import { Injectable } from "@nestjs/common";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { clients, invoiceItems, invoices, payments, products, stockLevels } from "../../db/schema";
import { fromMinor } from "../../shared/money";

type Ctx = { tenantId: string };
type Range = { start: string; end: string; groupBy: string };

@Injectable()
export class ReportsService {
  async sales(ctx: Ctx, query: { period?: string; startDate?: string; endDate?: string; groupBy?: string }) {
    const db = getDb();
    const { start, end, groupBy } = this.parseRange(query);
    const bucket = groupBy === "month" ? sql`date_trunc('month', ${invoices.issueDate})` : sql`${invoices.issueDate}`;

    const [summary] = await db
      .select({
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        paid: sql<number>`coalesce(sum(${invoices.paidMinor}), 0)::bigint`,
        due: sql<number>`coalesce(sum(${invoices.dueMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(and(...this.baseFilters(ctx.tenantId, start, end)));

    const data = await db
      .select({
        id: groupBy === "month" ? sql<string>`to_char(${bucket}, 'YYYY-MM')` : sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        paid: sql<number>`coalesce(sum(${invoices.paidMinor}), 0)::bigint`,
        due: sql<number>`coalesce(sum(${invoices.dueMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(and(...this.baseFilters(ctx.tenantId, start, end)))
      .groupBy(bucket)
      .orderBy(bucket);

    const count = Number(summary?.count ?? 0);
    const totalMinor = Number(summary?.total ?? 0);
    return {
      summary: {
        total: fromMinor(totalMinor),
        paid: fromMinor(Number(summary?.paid ?? 0)),
        due: fromMinor(Number(summary?.due ?? 0)),
        count,
        avgInvoice: count ? fromMinor(Math.round(totalMinor / count)) : 0,
      },
      data: data.map((row) => ({
        _id: row.id,
        total: fromMinor(Number(row.total)),
        paid: fromMinor(Number(row.paid)),
        due: fromMinor(Number(row.due)),
        count: Number(row.count),
      })),
      range: { start, end, groupBy },
    };
  }

  async paymentsReport(ctx: Ctx, query: { startDate?: string; endDate?: string }) {
    const db = getDb();
    const { start, end } = this.parseRange(query);
    const filters = (extra?: ReturnType<typeof sql>) =>
      and(
        eq(payments.tenantId, ctx.tenantId),
        eq(payments.status, "completed"),
        gte(payments.paidAt, new Date(`${start}T00:00:00.000Z`)),
        lte(payments.paidAt, new Date(`${end}T23:59:59.999Z`)),
        ...(extra ? [extra] : []),
      );

    const [summary] = await db
      .select({ total: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::bigint`, count: sql<number>`count(*)::int` })
      .from(payments)
      .where(filters());

    const byMethod = await db
      .select({ method: payments.method, total: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::bigint`, count: sql<number>`count(*)::int` })
      .from(payments)
      .where(filters())
      .groupBy(payments.method);

    const monthly = await db
      .select({
        method: payments.method,
        year: sql<string>`to_char(date_trunc('year', ${payments.paidAt}), 'YYYY')`,
        month: sql<string>`to_char(date_trunc('month', ${payments.paidAt}), 'MM')`,
        total: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::bigint`,
      })
      .from(payments)
      .where(filters())
      .groupBy(sql`date_trunc('year', ${payments.paidAt})`, sql`date_trunc('month', ${payments.paidAt})`, payments.method);

    return {
      summary: { totalAmount: fromMinor(Number(summary?.total ?? 0)), count: Number(summary?.count ?? 0) },
      data: byMethod.map((row) => ({
        _id: row.method,
        total: fromMinor(Number(row.total)),
        count: Number(row.count),
        monthlyData: monthly
          .filter((entry) => entry.method === row.method)
          .map((entry) => ({ year: Number(entry.year), month: Number(entry.month), total: fromMinor(Number(entry.total)) })),
      })),
      range: { start, end, groupBy: "day" },
    };
  }

  async clientsReport(ctx: Ctx) {
    const db = getDb();
    const [summary] = await db
      .select({
        totalClients: sql<number>`count(*)::int`,
        activeClients: sql<number>`coalesce(sum(case when ${clients.isActive} then 1 else 0 end), 0)::int`,
      })
      .from(clients)
      .where(and(eq(clients.tenantId, ctx.tenantId), isNull(clients.deletedAt)));

    const rows = await db
      .select({
        clientId: invoices.clientId,
        name: clients.name,
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), sql`${invoices.status} not in ('draft','cancelled')`))
      .groupBy(invoices.clientId, clients.name)
      .orderBy(desc(sql`sum(${invoices.totalMinor})`))
      .limit(10);

    return {
      summary: { totalClients: Number(summary?.totalClients ?? 0), activeClients: Number(summary?.activeClients ?? 0) },
      data: rows.map((row) => ({
        client: { _id: row.clientId, name: row.name ?? "—" },
        totalPurchases: fromMinor(Number(row.total)),
        invoiceCount: Number(row.count),
      })),
    };
  }

  async productsReport(ctx: Ctx) {
    const db = getDb();
    const [summary] = await db
      .select({
        totalProducts: sql<number>`count(*)::int`,
        lowStock: sql<number>`coalesce(sum(case when coalesce(${stockLevels.quantity}, 0) <= ${products.minStock} then 1 else 0 end), 0)::int`,
      })
      .from(products)
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)));

    const rows = await db
      .select({
        productId: invoiceItems.productId,
        name: products.name,
        quantity: sql<number>`coalesce(sum(${invoiceItems.quantity}), 0)::numeric`,
        revenue: sql<number>`coalesce(sum(${invoiceItems.lineTotalMinor}), 0)::bigint`,
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
      .leftJoin(products, eq(products.id, invoiceItems.productId))
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), sql`${invoices.status} not in ('draft','cancelled')`))
      .groupBy(invoiceItems.productId, products.name)
      .orderBy(desc(sql`sum(${invoiceItems.lineTotalMinor})`))
      .limit(10);

    return {
      summary: { totalProducts: Number(summary?.totalProducts ?? 0), lowStock: Number(summary?.lowStock ?? 0) },
      data: rows
        .filter((row) => row.productId)
        .map((row) => ({
          product: { _id: row.productId, name: row.name ?? "—" },
          totalQuantity: Number(row.quantity),
          totalRevenue: fromMinor(Number(row.revenue)),
        })),
    };
  }

  async agingReport(ctx: Ctx) {
    const db = getDb();
    const rows = await db
      .select({
        invoiceId: invoices.id,
        number: invoices.number,
        clientName: clients.name,
        dueDate: invoices.dueDate,
        dueMinor: invoices.dueMinor,
        daysOverdue: sql<number>`(current_date - ${invoices.dueDate})::int`,
      })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(
        and(
          eq(invoices.tenantId, ctx.tenantId),
          isNull(invoices.deletedAt),
          sql`${invoices.status} not in ('draft','cancelled','paid')`,
          sql`${invoices.dueMinor} > 0`,
        ),
      );

    const buckets: Record<string, { count: number; total: number }> = {
      current: { count: 0, total: 0 },
      "1-30": { count: 0, total: 0 },
      "31-60": { count: 0, total: 0 },
      "61-90": { count: 0, total: 0 },
      "90+": { count: 0, total: 0 },
    };
    const details = rows.map((row) => {
      const days = Number(row.daysOverdue);
      const key = days <= 0 ? "current" : days <= 30 ? "1-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
      buckets[key].count += 1;
      buckets[key].total += Number(row.dueMinor);
      return {
        invoiceId: row.invoiceId,
        invoiceNumber: row.number,
        clientName: row.clientName ?? "—",
        dueDate: row.dueDate,
        amount: fromMinor(Number(row.dueMinor)),
        daysOverdue: Math.max(0, days),
        bucket: key,
      };
    });

    const totalOverdue = Object.entries(buckets)
      .filter(([key]) => key !== "current")
      .reduce((sum, [, value]) => sum + value.total, 0);

    return {
      summary: Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, { count: value.count, total: fromMinor(value.total) }])),
      totalOverdue: fromMinor(totalOverdue),
      details: details.sort((a, b) => b.daysOverdue - a.daysOverdue),
    };
  }

  /** Traffic sources are not collected yet: return an empty, well-formed report. */
  trafficSources(_ctx: Ctx) {
    return { data: [], total: 0 };
  }

  async exportCsv(ctx: Ctx, type: string): Promise<{ filename: string; csv: string }> {
    const report = type === "clients" ? await this.clientsReport(ctx) : await this.sales(ctx, {});
    if (type === "clients") {
      const rows = ["client_id,client_name,total_purchases,invoice_count"];
      for (const item of report.data as Array<{ client: { _id: string; name: string }; totalPurchases: number; invoiceCount: number }>) {
        rows.push(`${item.client._id},"${item.client.name.replace(/"/g, '""')}",${item.totalPurchases},${item.invoiceCount}`);
      }
      return { filename: "clients-report.csv", csv: rows.join("\n") };
    }
    const sales = report as Awaited<ReturnType<ReportsService["sales"]>>;
    const rows = ["date,total,paid,due,count"];
    for (const item of sales.data) rows.push(`${item._id},${item.total},${item.paid},${item.due},${item.count}`);
    return { filename: "sales-report.csv", csv: rows.join("\n") };
  }

  private baseFilters(tenantId: string, start: string, end: string) {
    return [
      eq(invoices.tenantId, tenantId),
      isNull(invoices.deletedAt),
      sql`${invoices.status} not in ('draft','cancelled')`,
      gte(invoices.issueDate, start),
      lte(invoices.issueDate, end),
    ];
  }

  private parseRange(query: { period?: string; startDate?: string; endDate?: string; groupBy?: string }): Range {
    const end = query.endDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    let start = query.startDate?.slice(0, 10);
    if (!start) {
      const now = new Date();
      const days = query.period === "day" ? 1 : query.period === "week" ? 7 : query.period === "year" ? 365 : 30;
      start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }
    return { start, end, groupBy: query.groupBy === "month" ? "month" : "day" };
  }
}
