import { Injectable } from "@nestjs/common";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { clients, invoices, payments, products, stockLevels } from "../../db/schema";
import { fromMinor } from "../../shared/money";

type Ctx = { tenantId: string };

function range(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

@Injectable()
export class DashboardService {
  async stats(ctx: Ctx) {
    const db = getDb();
    const { from } = range(365);

    const [invoiceAgg] = await db
      .select({
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        paid: sql<number>`coalesce(sum(${invoices.paidMinor}), 0)::bigint`,
        due: sql<number>`coalesce(sum(${invoices.dueMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
        draftCount: sql<number>`coalesce(sum(case when ${invoices.status} = 'draft' then 1 else 0 end), 0)::int`,
        overdueCount: sql<number>`coalesce(sum(case when ${invoices.status} = 'overdue' then 1 else 0 end), 0)::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), gte(invoices.issueDate, from)));

    const [paymentAgg] = await db
      .select({
        total: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(payments)
      .where(and(eq(payments.tenantId, ctx.tenantId), eq(payments.status, "completed")));

    const [clientAgg] = await db
      .select({
        total: sql<number>`count(*)::int`,
        totalBalance: sql<number>`coalesce(sum(${clients.balanceMinor}), 0)::bigint`,
      })
      .from(clients)
      .where(and(eq(clients.tenantId, ctx.tenantId), isNull(clients.deletedAt)));

    const [productAgg] = await db
      .select({
        total: sql<number>`count(*)::int`,
        lowStock: sql<number>`coalesce(sum(case when coalesce(${stockLevels.quantity}, 0) <= ${products.minStock} then 1 else 0 end), 0)::int`,
        totalStockValue: sql<number>`coalesce(sum(coalesce(${stockLevels.quantity}, 0) * ${products.priceMinor}), 0)::bigint`,
      })
      .from(products)
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)));

    const monthlySales = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${invoices.issueDate}), 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`,
        paid: sql<number>`coalesce(sum(${invoices.paidMinor}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), sql`${invoices.status} not in ('draft','cancelled')`))
      .groupBy(sql`date_trunc('month', ${invoices.issueDate})`)
      .orderBy(sql`date_trunc('month', ${invoices.issueDate})`)
      .limit(12);

    const topClients = await db
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
      .limit(5);

    const recentInvoices = await this.recentInvoices(ctx.tenantId, 5);
    const overdueInvoices = await this.overdueInvoices(ctx.tenantId, 5);
    const recentPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.tenantId, ctx.tenantId), eq(payments.status, "completed")))
      .orderBy(desc(payments.paidAt))
      .limit(5);
    const lowStockProducts = await db
      .select({
        _id: products.id,
        id: products.id,
        name: products.name,
        code: products.code,
        stock: stockLevels.quantity,
        minStock: products.minStock,
      })
      .from(products)
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt), sql`coalesce(${stockLevels.quantity}, 0) <= ${products.minStock}`))
      .limit(5);

    return {
      stats: {
        invoices: {
          total: fromMinor(Number(invoiceAgg?.total ?? 0)),
          count: Number(invoiceAgg?.count ?? 0),
          paid: fromMinor(Number(invoiceAgg?.paid ?? 0)),
          due: fromMinor(Number(invoiceAgg?.due ?? 0)),
        },
        payments: { total: fromMinor(Number(paymentAgg?.total ?? 0)), count: Number(paymentAgg?.count ?? 0) },
        clients: { total: Number(clientAgg?.total ?? 0), totalBalance: fromMinor(Number(clientAgg?.totalBalance ?? 0)) },
        products: {
          total: Number(productAgg?.total ?? 0),
          lowStock: Number(productAgg?.lowStock ?? 0),
          totalStockValue: fromMinor(Number(productAgg?.totalStockValue ?? 0)),
        },
      },
      charts: {
        monthlySales: monthlySales.map((row) => ({
          month: row.month,
          total: fromMinor(Number(row.total)),
          paid: fromMinor(Number(row.paid)),
          count: Number(row.count),
        })),
        topClients: topClients.map((row) => ({ clientId: row.clientId, name: row.name ?? "—", total: fromMinor(Number(row.total)), count: Number(row.count) })),
      },
      overview: {
        recentInvoices,
        overdueInvoices,
        recentPayments: recentPayments.map((payment) => ({
          _id: payment.id,
          id: payment.id,
          paymentNumber: payment.number,
          amount: fromMinor(Number(payment.amountMinor)),
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt.toISOString(),
        })),
        lowStockProducts: lowStockProducts.map((row) => ({
          _id: row._id,
          id: row.id,
          name: row.name,
          code: row.code,
          stock: Number(row.stock ?? 0),
          minStock: Number(row.minStock),
        })),
      },
      summary: {
        total: fromMinor(Number(invoiceAgg?.total ?? 0)),
        count: Number(invoiceAgg?.count ?? 0),
        paid: fromMinor(Number(invoiceAgg?.paid ?? 0)),
        due: fromMinor(Number(invoiceAgg?.due ?? 0)),
      },
    };
  }

  async quickStats(ctx: Ctx) {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const dayAgg = async (day: string) => {
      const [row] = await db
        .select({ total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`, count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt), eq(invoices.issueDate, day)));
      return { total: fromMinor(Number(row?.total ?? 0)), count: Number(row?.count ?? 0) };
    };

    const [todayAgg, yesterdayAgg] = await Promise.all([dayAgg(today), dayAgg(yesterday)]);

    const [counts] = await db
      .select({
        overdueCount: sql<number>`coalesce(sum(case when ${invoices.status} = 'overdue' then 1 else 0 end), 0)::int`,
        draftCount: sql<number>`coalesce(sum(case when ${invoices.status} = 'draft' then 1 else 0 end), 0)::int`,
        invoiceCount: sql<number>`count(*)::int`,
        pending: sql<number>`coalesce(sum(${invoices.dueMinor}), 0)::bigint`,
      })
      .from(invoices)
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt)));

    const [clientAgg] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(clients)
      .where(and(eq(clients.tenantId, ctx.tenantId), isNull(clients.deletedAt)));

    const [lowStock] = await db
      .select({ count: sql<number>`coalesce(sum(case when coalesce(${stockLevels.quantity}, 0) <= ${products.minStock} then 1 else 0 end), 0)::int` })
      .from(products)
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)));

    return {
      today: todayAgg,
      yesterday: yesterdayAgg,
      overdueCount: Number(counts?.overdueCount ?? 0),
      draftCount: Number(counts?.draftCount ?? 0),
      clientCount: Number(clientAgg?.total ?? 0),
      revenue: todayAgg.total,
      pending: fromMinor(Number(counts?.pending ?? 0)),
      invoices: Number(counts?.invoiceCount ?? 0),
      lowStock: Number(lowStock?.count ?? 0),
    };
  }

  private async recentInvoices(tenantId: string, limit: number) {
    const db = getDb();
    const rows = await db
      .select({ invoice: invoices, clientName: clients.name })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(eq(invoices.tenantId, tenantId), isNull(invoices.deletedAt)))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);
    return rows.map(({ invoice, clientName }) => ({
      _id: invoice.id,
      id: invoice.id,
      invoiceNumber: invoice.number,
      number: invoice.number,
      status: invoice.status,
      date: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: fromMinor(Number(invoice.totalMinor)),
      paidAmount: fromMinor(Number(invoice.paidMinor)),
      balance: fromMinor(Number(invoice.dueMinor)),
      clientName: clientName ?? "—",
      clientId: { _id: invoice.clientId, name: clientName ?? "" },
    }));
  }

  private async overdueInvoices(tenantId: string, limit: number) {
    const db = getDb();
    const rows = await db
      .select({ invoice: invoices, clientName: clients.name })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          isNull(invoices.deletedAt),
          sql`${invoices.status} in ('sent','partially_paid','overdue')`,
          sql`${invoices.dueMinor} > 0`,
          lte(invoices.dueDate, new Date().toISOString().slice(0, 10)),
        ),
      )
      .orderBy(invoices.dueDate)
      .limit(limit);
    return rows.map(({ invoice, clientName }) => ({
      _id: invoice.id,
      id: invoice.id,
      invoiceNumber: invoice.number,
      number: invoice.number,
      status: "overdue",
      date: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: fromMinor(Number(invoice.totalMinor)),
      paidAmount: fromMinor(Number(invoice.paidMinor)),
      balance: fromMinor(Number(invoice.dueMinor)),
      clientName: clientName ?? "—",
      clientId: { _id: invoice.clientId, name: clientName ?? "" },
    }));
  }
}
