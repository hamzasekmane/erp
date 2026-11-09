// services/analytics/analytics.api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  async exportReport(token: string, reportType: string, format: string = 'excel') {
    const response = await fetch(`${API_BASE_URL}/reports/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportType, format }),
    });
    
    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }
    
    return response.json();
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