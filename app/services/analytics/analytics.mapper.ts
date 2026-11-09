// services/analytics/analytics.mapper.ts

// ==========================================
// TYPES
// ==========================================

export interface SalesDataPoint {
  date: string;
  sales: number;
  count: number;
}

export interface SalesReportData {
  totalSales: number;
  totalInvoices: number;
  averageInvoice: number;
  data: SalesDataPoint[];
}

export interface PaymentMethodItem {
  method: string;
  count: number;
  amount: number;
}

export interface PaymentTimelineItem {
  date: string;
  amount: number;
}

export interface PaymentReportData {
  totalPayments: number;
  totalAmount: number;
  byMethod: PaymentMethodItem[];
  timeline: PaymentTimelineItem[];
}

export interface TopClientItem {
  clientId: string;
  clientName: string;
  totalSpent: number;
  invoiceCount: number;
}

export interface ClientReportData {
  totalClients: number;
  newClients: number;
  activeClients: number;
  topClients: TopClientItem[];
}

export interface TopProductItem {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface ProductReportData {
  totalProducts: number;
  totalSales: number;
  lowStock: number;
  topProducts: TopProductItem[];
}

export interface AgingDetailItem {
  invoiceId: string;
  clientName: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
}

export interface AgingReportData {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  totalDue: number;
  details?: AgingDetailItem[];
}
export interface TrafficSourceItem {
  source: string;
  percentage: number;
  change: number;
  color: string;
}

export interface TrafficSourceReportData {
  data: TrafficSourceItem[];
  total: number;
}

export const DEFAULT_TRAFFIC_SOURCE_REPORT: TrafficSourceReportData = {
  data: [],
  total: 0,
};

// ==========================================
// DEFAULT FALLBACK DATA
// ==========================================

export const DEFAULT_SALES_REPORT: SalesReportData = {
  totalSales: 0,
  totalInvoices: 0,
  averageInvoice: 0,
  data: [],
};

export const DEFAULT_PAYMENT_REPORT: PaymentReportData = {
  totalPayments: 0,
  totalAmount: 0,
  byMethod: [],
  timeline: [],
};

export const DEFAULT_CLIENT_REPORT: ClientReportData = {
  totalClients: 0,
  newClients: 0,
  activeClients: 0,
  topClients: [],
};

export const DEFAULT_PRODUCT_REPORT: ProductReportData = {
  totalProducts: 0,
  totalSales: 0,
  lowStock: 0,
  topProducts: [],
};

export const DEFAULT_AGING_REPORT: AgingReportData = {
  current: 0,
  days30: 0,
  days60: 0,
  days90: 0,
  over90: 0,
  totalDue: 0,
};

// ==========================================
// HELPER: Normalize array from object
// ==========================================

function normalizeArrayData(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data).filter(
      (key) => !key.startsWith('_') && key !== 'errors' && key !== '$errors'
    );
    return keys
      .map((key) => data[key])
      .filter((item) => item && typeof item === 'object');
  }
  return [];
}
export function normalizeTrafficSourceReport(rawData: any): TrafficSourceReportData {
  if (!rawData) return DEFAULT_TRAFFIC_SOURCE_REPORT;
  const data = rawData.data || [];
  const summary = rawData.summary || {};
  return {
    data: data.map((item: any) => ({
      source: String(item.source || ''),
      percentage: Number(item.percentage || 0),
      change: Number(item.change || 0),
      color: String(item.color || 'gray'),
    })),
    total: Number(summary.total || 0),
  };
}
// ==========================================
// NORMALIZERS (متوافقة مع هيكل الباكند)
// ==========================================

export function normalizeSalesReport(rawData: any): SalesReportData {
  if (!rawData) return DEFAULT_SALES_REPORT;

  const response = rawData;
  const summary = response.summary || {};
  const dataArray = response.data || [];

  // في الباكند: data عبارة عن مصفوفة من الكائنات تحتوي على _id (تاريخ أو عميل) وحقول total, count, paid, due
  const salesData: SalesDataPoint[] = dataArray.map((item: any) => {
    let dateStr = '';
    if (item._id) {
      if (typeof item._id === 'object') {
        // groupBy month/year
        dateStr = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      } else {
        // groupBy day (string YYYY-MM-DD)
        dateStr = item._id;
      }
    }
    return {
      date: dateStr,
      sales: Number(item.total || 0),
      count: Number(item.count || 0),
    };
  });

  return {
    totalSales: Number(summary.total || 0),
    totalInvoices: Number(summary.count || 0),
    averageInvoice: Number(summary.avgInvoice || 0),
    data: salesData,
  };
}

export function normalizePaymentReport(rawData: any): PaymentReportData {
  if (!rawData) return DEFAULT_PAYMENT_REPORT;

  const response = rawData;
  const summary = response.summary || {};
  const dataArray = response.data || [];

  // data هي مصفوفة تحتوي على _id (طريقة الدفع) و monthlyData
  const byMethod: PaymentMethodItem[] = dataArray.map((item: any) => ({
    method: String(item._id || ''),
    count: Number(item.count || 0),
    amount: Number(item.total || 0),
  }));

  // لبناء timeline من monthlyData (إن وجدت)
  let timeline: PaymentTimelineItem[] = [];
  if (dataArray.length > 0 && dataArray[0].monthlyData) {
    const allMonthly = dataArray.flatMap((item: any) => item.monthlyData || []);
    const groupedByMonth = allMonthly.reduce((acc: any, curr: any) => {
      const key = `${curr.year}-${String(curr.month).padStart(2, '0')}`;
      if (!acc[key]) acc[key] = 0;
      acc[key] += curr.total;
      return acc;
    }, {});
    timeline = Object.entries(groupedByMonth).map(([date, amount]) => ({
      date,
      amount: Number(amount),
    }));
  }

  return {
    totalPayments: Number(summary.count || 0),
    totalAmount: Number(summary.total || 0),
    byMethod,
    timeline,
  };
}

export function normalizeClientReport(rawData: any): ClientReportData {
  if (!rawData) return DEFAULT_CLIENT_REPORT;

  const response = rawData;
  const summary = response.summary || {};
  const dataArray = response.data || [];

  const topClients: TopClientItem[] = dataArray.map((item: any) => ({
    clientId: String(item.client?._id || item._id || ''),
    clientName: String(item.client?.name || ''),
    totalSpent: Number(item.totalPurchases || 0),
    invoiceCount: Number(item.invoiceCount || 0),
  }));

  return {
    totalClients: Number(summary.totalClients || 0),
    newClients: 0, // غير متوفر حاليًا في summary، يمكن إضافته لاحقًا
    activeClients: Number(summary.activeClients || 0),
    topClients,
  };
}

export function normalizeProductReport(rawData: any): ProductReportData {
  if (!rawData) return DEFAULT_PRODUCT_REPORT;

  const response = rawData;
  const summary = response.summary || {};
  const dataArray = response.data || [];

  const topProducts: TopProductItem[] = dataArray.map((item: any) => ({
    productId: String(item.product?._id || item._id || ''),
    productName: String(item.product?.name || ''),
    quantitySold: Number(item.totalQuantity || 0),
    revenue: Number(item.totalRevenue || 0),
  }));

  return {
    totalProducts: Number(summary.totalProducts || 0),
    totalSales: 0, // غير متوفر في summary، يمكن حسابه من topProducts
    lowStock: Number(summary.lowStock || 0),
    topProducts,
  };
}

export function normalizeAgingReport(rawData: any): AgingReportData {
  if (!rawData) return DEFAULT_AGING_REPORT;

  const response = rawData;
  // الباكند يعيد { summary: { current: {...}, '1-30': {...}, ... }, totalOverdue }
  const summary = response.summary || {};
  const buckets = summary;

  const details: AgingDetailItem[] = [];
  // يمكن تجميع التفاصيل من كل فئة عمرية
  Object.entries(buckets).forEach(([bucketName, bucketData]: [string, any]) => {
    if (bucketName === 'totalOverdue') return;
    const invoices = bucketData.invoices || [];
    invoices.forEach((inv: any) => {
      details.push({
        invoiceId: String(inv.invoice?._id || ''),
        clientName: String(inv.client?.name || ''),
        dueDate: String(inv.invoice?.dueDate || ''),
        amount: Number(inv.invoice?.balance || 0),
        daysOverdue: Number(inv.daysOverdue || 0),
      });
    });
  });

  return {
    current: Number(buckets.current?.amount || 0),
    days30: Number(buckets['1-30']?.amount || 0),
    days60: Number(buckets['31-60']?.amount || 0),
    days90: Number(buckets['61-90']?.amount || 0),
    over90: Number(buckets['90+']?.amount || 0),
    totalDue: Number(response.totalOverdue || 0),
    details,
  };
}

// ==========================================
// SIMPLE EXTRACTOR
// ==========================================

export function extractData<T = any>(rawResponse: any): T {
  if (!rawResponse) return null as any;
  return rawResponse.data || rawResponse;
}