// app/types/analytics.types.ts
export interface AnalyticsCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  href: string;
}

export interface RecentActivity {
  id: string;
  type: 'sale' | 'user' | 'product' | 'alert';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}

export interface TrafficSource {
  source: string;
  percentage: number;
  change: number;
  color: string;
}

export interface TopProduct {
  name: string;
  revenue: number;
  sales: number;
  growth: number;
}

export interface QuickStat {
  label: string;
  value: string | number;
  change: number;
}

export interface SalesReportParams {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'month' | 'client' | 'status';
}

export interface AnalyticsData {
  kpiCards: AnalyticsCard[];
  recentActivities: RecentActivity[];
  trafficSources: TrafficSource[];
  topProducts: TopProduct[];
  quickStats: QuickStat[];
  chartData: number[];
}