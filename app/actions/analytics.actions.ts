// app/actions/analytics.actions.ts
'use server';

import { analyticsService } from '@/app/services/analytics.service';

export async function exportAnalyticsData(dateRange: string) {
  try {
    // Appeler l'API d'export du backend
    const result = await analyticsService.exportReport('sales', 'excel');
    
    if (result.success) {
      // Récupérer le fichier depuis l'URL
      const response = await fetch(result.downloadUrl);
      const blob = await response.blob();
      
      return {
        success: true,
        data: await blob.text(),
        filename: `analytics-report-${Date.now()}.csv`
      };
    }
    
    return { success: false, data: null };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, data: null };
  }
}