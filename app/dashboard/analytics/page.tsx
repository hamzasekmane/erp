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

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const params = { period: 'week' } as const;

  try {
    const [sales, payments, clients, products, aging] = await Promise.allSettled([
      analyticsService.getSalesReport(token, params),
      analyticsService.getPaymentReport(token, params),
      analyticsService.getClientReport(token, params),
      analyticsService.getProductReport(token, params),
      analyticsService.getAgingReport(token),
    ]);

    const initialData = {
      sales: sales.status === 'fulfilled' ? sales.value : null,
      payments: payments.status === 'fulfilled' ? payments.value : null,
      clients: clients.status === 'fulfilled' ? clients.value : null,
      products: products.status === 'fulfilled' ? products.value : null,
      aging: aging.status === 'fulfilled' ? aging.value : null,
    };

    return (
      <AnalyticsDashboardClient
        token={token}
        initialData={initialData}
        initialDateRange="7d"
      />
    );
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
}