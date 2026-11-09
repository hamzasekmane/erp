// services/dashboard/dashboard.mapper.ts

import {
  DashboardStatsSchema,
  QuickStatsSchema,
  UserSchema,
  DashboardData,
  QuickStats,
  InvoiceTableItem,
} from "@/app/types/dashboard";

// ==========================================
// DEFAULT FALLBACK DATA
// ==========================================

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  stats: {
    invoices: { total: 0, count: 0, paid: 0, due: 0 },
    payments: { total: 0, count: 0 },
    clients: { total: 0, totalBalance: 0 },
    products: { total: 0, lowStock: 0, totalStockValue: 0 },
  },
  summary: { total: 0, count: 0, paid: 0, due: 0 },
  byStatus: [],
  overview: {
    recentInvoices: [],
    recentPayments: [],
    lowStockProducts: [],
    overdueInvoices: [],
  },
  charts: {
    monthlySales: [],
    topClients: [],
  },
};

export const DEFAULT_QUICK_STATS: QuickStats = {
  today: { total: 0, count: 0 },
  yesterday: { total: 0, count: 0 },
  overdueCount: 0,
  draftCount: 0,
  clientCount: 0,
  revenue: 0,
  pending: 0,
  invoices: 0,
  lowStock: 0,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Normalize array data from API (convert object with numeric keys to array)
 * Fix for Next.js server component serialization
 */
export function normalizeArrayData(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data).filter(
      (key) => !key.startsWith("_") && key !== "errors" && key !== "$errors"
    );
    return keys
      .map((key) => data[key])
      .filter((item) => item && typeof item === "object" && !item._errors);
  }
  return [];
}

/**
 * Transform invoice to InvoiceTableItem format
 */
export function toInvoiceTableItem(invoice: any): InvoiceTableItem {
  const invoiceNumber = String(
    invoice.invoiceNumber ||
      invoice.number ||
      `FACT-${String(invoice._id || invoice.id || "").slice(-6)}`
  );

  let clientName = invoice.clientName;
  let clientId: string | { name: string } | undefined = invoice.clientId;

  if (!clientName) {
    if (invoice.clientId && typeof invoice.clientId === "object") {
      if (invoice.clientId.name) {
        clientName = invoice.clientId.name;
        clientId = { name: clientName };
      }
    } else if (invoice.client?.name) {
      clientName = invoice.client.name;
      clientId = { name: clientName };
    }
  }

  let paidDate = invoice.paidDate;
  if (!paidDate && invoice.status === "paid") {
    paidDate = invoice.updatedAt || invoice.createdAt || new Date().toISOString();
  }

  return {
    _id: String(invoice._id || invoice.id || crypto.randomUUID()),
    invoiceNumber,
    total: Number(invoice.total || invoice.amount || 0),
    amount: Number(invoice.amount || invoice.total || 0),
    paidAmount: Number(invoice.paidAmount || 0),
    dueAmount: Number(invoice.dueAmount || invoice.balance || 0),
    balance: Number(invoice.balance || invoice.dueAmount || 0),
    status: String(invoice.status || "draft").toLowerCase(),
    clientName: clientName || undefined,
    clientId: clientId,
    paidDate: paidDate || undefined,
  };
}

/**
 * Normalize dashboard data from API
 */
export function normalizeDashboardData(rawData: any): DashboardData {
  if (!rawData) return DEFAULT_DASHBOARD_DATA;

  const data = rawData.data || rawData;

  const recentInvoices = normalizeArrayData(
    data.overview?.recentInvoices || data.recentInvoices
  ).map(toInvoiceTableItem);

  const overdueInvoices = normalizeArrayData(
    data.overview?.overdueInvoices
  ).map(toInvoiceTableItem);

  const recentPayments = normalizeArrayData(
    data.overview?.recentPayments || data.recentPayments
  );
  const lowStockProducts = normalizeArrayData(
    data.overview?.lowStockProducts || data.lowStockProducts
  );
  const monthlySales = normalizeArrayData(
    data.charts?.monthlySales || data.monthlySalesArr
  );
  const topClients = normalizeArrayData(
    data.charts?.topClients || data.topClients
  );

  const result = {
    stats: {
      invoices: {
        total: Number(data.stats?.invoices?.total ?? data.summary?.total ?? 0),
        count: Number(data.stats?.invoices?.count ?? data.summary?.count ?? 0),
        paid: Number(data.stats?.invoices?.paid ?? data.summary?.paid ?? 0),
        due: Number(data.stats?.invoices?.due ?? data.summary?.due ?? 0),
      },
      payments: {
        total: Number(data.stats?.payments?.total ?? data.paymentStats?.total ?? 0),
        count: Number(data.stats?.payments?.count ?? data.paymentStats?.count ?? 0),
      },
      clients: {
        total: Number(data.stats?.clients?.total ?? data.clientStats?.total ?? 0),
        totalBalance: Number(
          data.stats?.clients?.totalBalance ?? data.clientStats?.totalBalance ?? 0
        ),
      },
      products: {
        total: Number(data.stats?.products?.total ?? data.productStats?.total ?? 0),
        lowStock: Number(data.stats?.products?.lowStock ?? data.productStats?.lowStock ?? 0),
        totalStockValue: Number(
          data.stats?.products?.totalStockValue ?? data.productStats?.totalStockValue ?? 0
        ),
      },
    },
    summary: {
      total: Number(data.summary?.total ?? 0),
      count: Number(data.summary?.count ?? 0),
      paid: Number(data.summary?.paid ?? 0),
      due: Number(data.summary?.due ?? 0),
    },
    byStatus: Array.isArray(data.byStatus) ? data.byStatus : [],
    overview: {
      recentInvoices,
      recentPayments,
      lowStockProducts,
      overdueInvoices,
    },
    charts: {
      monthlySales: monthlySales.map((item: any) => ({
        name: String(item.name || item._id || ""),
        sales: Number(item.sales || item.value || 0),
        _id: item._id,
      })),
      topClients,
    },
  };

  // Validate with Zod in development
  if (process.env.NODE_ENV === "development") {
    const validation = DashboardStatsSchema.safeParse(result);
    if (!validation.success) {
      console.warn("⚠️ Dashboard data validation:", validation.error.format());
    }
  }

  return result;
}

/**
 * Normalize quick stats from API
 */
export function normalizeQuickStats(rawData: any): QuickStats {
  if (!rawData) return DEFAULT_QUICK_STATS;

  const data = rawData.data || rawData;

  return {
    today: {
      total: Number(data.today?.total ?? data.revenue ?? 0),
      count: Number(data.today?.count ?? data.invoices ?? 0),
    },
    yesterday: {
      total: Number(data.yesterday?.total ?? 0),
      count: Number(data.yesterday?.count ?? 0),
    },
    overdueCount: Number(data.overdueCount ?? 0),
    draftCount: Number(data.draftCount ?? 0),
    clientCount: Number(data.clientCount ?? data.clients ?? 0),
    revenue: Number(data.revenue ?? 0),
    pending: Number(data.pending ?? 0),
    invoices: Number(data.invoices ?? 0),
    lowStock: Number(data.lowStock ?? 0),
  };
}

/**
 * Normalize user profile data (with optional Zod validation)
 */
export function normalizeUserProfile(rawData: any) {
  const userData = rawData.data || rawData;

  const validation = UserSchema.safeParse(userData);
  if (!validation.success && process.env.NODE_ENV === "development") {
    console.warn("⚠️ User data validation:", validation.error.format());
  }

  return validation.success ? validation.data : userData;
}