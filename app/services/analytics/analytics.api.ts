import { apiBaseUrl } from "@/app/lib/apiBase";
// services/analytics/analytics.api.ts

const API_BASE_URL = apiBaseUrl();

export interface SalesReportParams {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'month' | 'client' | 'status';
}

export const analyticsApi = {
  async fetchSalesReport(token: string, params: SalesReportParams) {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/reports/sales?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Sales report failed with status ${response.status}`);
    }
    
    return response.json();
  },

  async fetchPaymentReport(token: string, params: any) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/reports/payments?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Payment report failed with status ${response.status}`);
    }
    
    return response.json();
  },

  async fetchClientReport(token: string, params: any) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/reports/clients?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Client report failed with status ${response.status}`);
    }
    
    return response.json();
  },

  async fetchProductReport(token: string, params: any) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/reports/products?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Product report failed with status ${response.status}`);
    }
    
    return response.json();
  },

  async fetchAgingReport(token: string) {
    const response = await fetch(`${API_BASE_URL}/reports/aging`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Aging report failed with status ${response.status}`);
    }
    
    return response.json();
  },

  async exportReport(token: string, reportType: string, format: string = 'csv') {
    // Backend contract: GET /reports/export?type=<report>&format=csv -> text/csv
    const queryString = new URLSearchParams({ type: reportType, format }).toString();
    const response = await fetch(`${API_BASE_URL}/reports/export?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }

    return {
      success: true as const,
      csv: await response.text(),
      filename: `export-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  },
  async fetchTrafficSources(token: string, params?: { startDate?: string; endDate?: string }) {
  const queryString = params ? new URLSearchParams(params).toString() : '';
  const response = await fetch(`${API_BASE_URL}/reports/traffic-sources?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Traffic sources failed with status ${response.status}`);
  return response.json();
}
};