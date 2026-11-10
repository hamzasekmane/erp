// app/actions/analytics.actions.ts
'use server';

import { cookies } from "next/headers";
import analyticsService from '@/app/services/analytics/analytics.service';

export async function exportAnalyticsData(dateRange: string) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return { success: false, data: null, message: "Session expirée" };
    }

    const result = await analyticsService.exportReport(token, "sales", "csv");
    return {
      success: true,
      data: result.csv,
      filename: result.filename,
      dateRange,
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, data: null, message: "Export impossible" };
  }
}
