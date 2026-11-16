// app/dashboard/analytics/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { analyticsService } from '@/app/services/analytics';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';
import type {
  SalesReportData,
  PaymentReportData,
  ClientReportData,
  ProductReportData,
  AgingReportData,
} from '@/app/services/analytics/analytics.mapper';

type InitialData = {
  sales: SalesReportData | null;
  payments: PaymentReportData | null;
  clients: ClientReportData | null;
  products: ProductReportData | null;
  aging: AgingReportData | null;
};

/**
 * Loads the dashboard payload.
 *
 * Deliberately separate from rendering: JSX must not be constructed inside a
 * `try` (react-hooks/error-boundaries). React renders asynchronously, so a throw
 * from a child component would escape the catch entirely and the caller would
 * believe the failure was handled. Fetching here and rendering below keeps the
 * try/catch about data only, which is what it can actually catch.
 */
async function loadInitialData(token: string): Promise<InitialData> {
  const params = { period: 'week' } as const;
  const [sales, payments, clients, products, aging] = await Promise.allSettled([
    analyticsService.getSalesReport(token, params),
    analyticsService.getPaymentReport(token, params),
    analyticsService.getClientReport(token, params),
    analyticsService.getProductReport(token, params),
    analyticsService.getAgingReport(token),
  ]);

  return {
    sales: sales.status === 'fulfilled' ? sales.value : null,
    payments: payments.status === 'fulfilled' ? payments.value : null,
    clients: clients.status === 'fulfilled' ? clients.value : null,
    products: products.status === 'fulfilled' ? products.value : null,
    aging: aging.status === 'fulfilled' ? aging.value : null,
  };
}

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let initialData: InitialData;
  try {
    initialData = await loadInitialData(token);
  } catch (error) {
    console.error('Failed to fetch initial analytics data:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">تعذر تحميل بيانات التحليلات</p>
          <p className="text-sm text-gray-500">يرجى المحاولة لاحقاً</p>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsDashboardClient
      token={token}
      initialData={initialData}
      initialDateRange="7d"
    />
  );
}
