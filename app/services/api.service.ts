// app/services/api.service.ts
import { apiBaseUrl } from "@/app/lib/apiBase";
import axios from 'axios';

const API_BASE_URL = apiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Ajouter le token d'authentification
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const reportService = {
  // Rapport des ventes (utilise votre controller existant)
  async getSalesReport(params: any) {
    const response = await apiClient.get('/reports/sales', { params });
    return response.data;
  },

  // Rapport des produits (utilise votre controller existant)
  async getProductReport(params: any) {
    const response = await apiClient.get('/reports/products', { params });
    return response.data;
  },

  // Rapport des clients (utilise votre controller existant)
  async getClientReport(params: any) {
    const response = await apiClient.get('/reports/clients', { params });
    return response.data;
  },

  // Rapport des paiements (utilise votre controller existant)
  async getPaymentReport(params: any) {
    const response = await apiClient.get('/reports/payments', { params });
    return response.data;
  },

  // Aging report (créances)
  async getAgingReport() {
    const response = await apiClient.get('/reports/aging');
    return response.data;
  },

  // Export
  async exportReport(reportType: string, format: string = 'excel') {
    const response = await apiClient.post('/reports/export', { reportType, format });
    return response.data;
  }
};