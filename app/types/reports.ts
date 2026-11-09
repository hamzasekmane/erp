// types/reports.ts

// إحصائيات الملخص
export interface SummaryStat {
  total: number;
  count: number;
  avg: number;
}

// إحصائيات طريقة الدفع
export interface MethodStat {
  _id: string;
  total: number;
  count: number;
}

// إحصائيات يومية
export interface DailyStat {
  _id: string;
  total: number;
  count: number;
}

// استجابة API للإحصائيات
export interface StatsResponse {
  summary: SummaryStat[];
  methods: MethodStat[];
  daily: DailyStat[];
}

// خصائص بطاقة الإحصائيات
export interface StatCardProps {
  label: string;
  value: string | number;
  subLabel: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'purple';
}

// خصائص بطاقة الإجراء السريع
export interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: 'blue' | 'emerald' | 'amber';
  onClick?: () => void;
}

// خصائص حالة فارغة
export interface EmptyStateProps {
  message: string;
}

// خيارات التصدير
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeSummary?: boolean;
  includeMethods?: boolean;
  includeDaily?: boolean;
}

// تقرير للتصدير
export interface ExportReportData {
  summary: SummaryStat[];
  methods: MethodStat[];
  daily: DailyStat[];
}
