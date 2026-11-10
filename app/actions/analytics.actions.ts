// app/actions/analytics.actions.ts
'use server';

import { cookies } from "next/headers";
import analyticsService from '@/app/services/analytics/analytics.service';

const REPORT_TYPES = ['sales', 'payments', 'clients', 'products', 'aging'] as const;
type ReportType = (typeof REPORT_TYPES)[number];

export async function exportAnalyticsData(reportType: string = "sales", dateRange: string = "30d") {
  const type = (REPORT_TYPES as readonly string[]).includes(reportType) ? (reportType as ReportType) : "sales";
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return { success: false, data: null, filename: null, message: "Session expirée" };
    }

    const result = await analyticsService.exportReport(token, type, "csv");
    return {
      success: true,
      data: result.csv,
      filename: result.filename || `export-${type}-${new Date().toISOString().slice(0, 10)}.csv`,
      dateRange,
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      data: null,
      filename: null,
      message: error instanceof Error ? error.message : "Export impossible",
    };
  }
}
