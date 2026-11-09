// services/analytics/analytics.service.ts

import { analyticsApi, SalesReportParams } from './analytics.api';
import {
  normalizeSalesReport,
  normalizePaymentReport,
  normalizeClientReport,
  normalizeProductReport,
  normalizeAgingReport,
  DEFAULT_SALES_REPORT,
  DEFAULT_PAYMENT_REPORT,
  DEFAULT_CLIENT_REPORT,
  DEFAULT_PRODUCT_REPORT,
  DEFAULT_AGING_REPORT,

} from './analytics.mapper';
import { normalizeTrafficSourceReport, DEFAULT_TRAFFIC_SOURCE_REPORT, TrafficSourceReportData } from './analytics.mapper';

const analyticsService = {
  /**
   * Récupérer le rapport de ventes
   */
  async getSalesReport(token: string, params: SalesReportParams) {
    try {
      const result = await analyticsApi.fetchSalesReport(token, params);
      return normalizeSalesReport(result);
    } catch (error) {
      console.error('❌ Error fetching sales report:', error);
      return DEFAULT_SALES_REPORT; // Fallback sécurisé
    }
  },

  /**
   * Récupérer le rapport de paiements
   */
  async getPaymentReport(token: string, params: any) {
    try {
      const result = await analyticsApi.fetchPaymentReport(token, params);
      return normalizePaymentReport(result);
    } catch (error) {
      console.error('❌ Error fetching payment report:', error);
      return DEFAULT_PAYMENT_REPORT;
    }
  },

  /**
   * Récupérer le rapport clients
   */
  async getClientReport(token: string, params: any) {
    try {
      const result = await analyticsApi.fetchClientReport(token, params);
      return normalizeClientReport(result);
    } catch (error) {
      console.error('❌ Error fetching client report:', error);
      return DEFAULT_CLIENT_REPORT;
    }
  },

  /**
   * Récupérer le rapport produits
   */
  async getProductReport(token: string, params: any) {
    try {
      const result = await analyticsApi.fetchProductReport(token, params);
      return normalizeProductReport(result);
    } catch (error) {
      console.error('❌ Error fetching product report:', error);
      return DEFAULT_PRODUCT_REPORT;
    }
  },

  /**
   * Récupérer le rapport d'aging (créances)
   */
  async getAgingReport(token: string) {
    try {
      const result = await analyticsApi.fetchAgingReport(token);
      return normalizeAgingReport(result);
    } catch (error) {
      console.error('❌ Error fetching aging report:', error);
      return DEFAULT_AGING_REPORT;
    }
  },

  /**
   * Exporter un rapport
   */
  async exportReport(token: string, reportType: string, format: string = 'excel') {
    try {
      const result = await analyticsApi.exportReport(token, reportType, format);
      return result;
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      throw error;
    }
  },
  async getTrafficSources(token: string, params?: { startDate?: string; endDate?: string }): Promise<TrafficSourceReportData> {
  try {
    const result = await analyticsApi.fetchTrafficSources(token, params);
    return normalizeTrafficSourceReport(result);
  } catch (error) {
    console.error('❌ Error fetching traffic sources:', error);
    return DEFAULT_TRAFFIC_SOURCE_REPORT;
  }
}
};

export default analyticsService;