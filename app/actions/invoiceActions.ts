"use server";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Types simplifiés (à adapter selon votre vrai service frontend)
interface InvoiceFilters {
  search?: string;
  status?: string;
  clientId?: string;
  fromDate?: string;
  toDate?: string;
  dueFrom?: string;
  dueTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  pagination?: any;
  stats?: any;
  filters?: any;
}

/**
 * Récupération sécurisée du token
 */
async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || "";
}

/**
 * Appel générique vers l'API backend
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse> {
  const token = await getAuthToken();
  const baseUrl = apiBaseUrl();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || "Erreur API", data: null };
    }
    return { success: true, ...data };
  } catch (error: any) {
    console.error(`API Error ${endpoint}:`, error);
    return { success: false, message: error.message || "Erreur réseau", data: null };
  }
}

/**
 * Réponse unifiée avec revalidation
 */
function handleResponse(res: ApiResponse, path?: string): ApiResponse {
  if (res.success && path) revalidatePath(path);
  return {
    success: res.success,
    message: res.message || (res.success ? "Opération réussie" : "Échec de l'opération"),
    data: res.data,
    pagination: res.pagination,
    stats: res.stats,
    filters: res.filters,
  };
}

// ==========================================
// 1. ACTIONS DE LECTURE (READ)
// ==========================================

export async function getInvoicesAction(filters: InvoiceFilters = {}) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée", data: [], pagination: { total: 0, pages: 0 } };

  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const res = await apiRequest(`/invoices?${queryParams.toString()}`);
  return {
    success: res.success,
    data: res.data || [],
    pagination: res.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
    stats: res.stats || null,
    filters: res.filters || null,
    message: res.message,
  };
}

export async function getInvoiceAction(id: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const res = await apiRequest(`/invoices/${id}`);
  return handleResponse(res);
}

export async function getInvoiceStatsAction(period: string = 'month') {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée", data: null };
  const res = await apiRequest(`/invoices/stats?period=${period}`);
  return handleResponse(res);
}

export async function getOverdueInvoicesAction(limit: number = 10) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée", data: [] };
  const res = await apiRequest(`/invoices/overdue?limit=${limit}`);
  return handleResponse(res);
}

export async function getClientInvoicesAction(clientId: string, filters: { status?: string; page?: number } = {}) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée", data: [] };
  const query = new URLSearchParams();
  if (filters.status) query.append("status", filters.status);
  if (filters.page) query.append("page", String(filters.page));
  const res = await apiRequest(`/invoices/client/${clientId}?${query.toString()}`);
  return handleResponse(res);
}

// ==========================================
// 2. ACTIONS D'ÉCRITURE (WRITE)
// ==========================================

export async function createInvoiceAction(_prevState: any, data: any) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée." };
  const res = await apiRequest("/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "/dashboard/invoices");
}

export async function updateInvoiceAction(id: string, _prevState: any, data: any) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const res = await apiRequest(`/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "/dashboard/invoices");
}

export async function duplicateInvoiceAction(id: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const res = await apiRequest(`/invoices/${id}/duplicate`, { method: "POST" });
  return handleResponse(res, "/dashboard/invoices");
}

export async function updateInvoiceStatusAction(_prevState: any, payload: { id: string; status: string }) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const res = await apiRequest(`/invoices/${payload.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: payload.status.toLowerCase() }),
  });
  return handleResponse(res, "/dashboard/invoices");
}

export async function deleteInvoiceAction(_prevState: any, formData: FormData | string) {
  const token = await getAuthToken();
  const id = typeof formData === "string" ? formData : (formData.get("invoiceId") as string);
  if (!id) return { success: false, message: "ID manquant" };
  const res = await apiRequest(`/invoices/${id}`, { method: "DELETE" });
  return handleResponse(res, "/dashboard/invoices");
}

// ==========================================
// 3. ACTIONS DE PAIEMENT (PAYMENT)
// ==========================================

export async function processPaymentAction(_prevState: any, { id, paymentData }: { id: string; paymentData: { amount: number; method: string; notes?: string } }) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const res = await apiRequest(`/invoices/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
  return handleResponse(res, "/dashboard/invoices");
}

// ==========================================
// 4. ACTIONS D'ENVOI (SEND)
// ==========================================

export async function sendInvoiceAction(_prevState: any, { id, data }: { id: string; data: { sendEmail?: boolean; message?: string } }) {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const res = await apiRequest(`/invoices/${id}/send`, {
    method: "POST",
    body: JSON.stringify({ sendEmail: true, ...data }),
  });
  revalidatePath(`/dashboard/invoices/${id}`);
  return handleResponse(res);
}

export async function sendInvoiceReminderAction(_prevState: any, id: string) {
  // Le backend n'a pas de route dédiée "reminder", on réutilise send avec un flag
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const res = await apiRequest(`/invoices/${id}/send`, {
    method: "POST",
    body: JSON.stringify({ sendEmail: true, message: "Rappel de paiement" }),
  });
  return handleResponse(res);
}

// ==========================================
// 5. ACTIONS D'EXPORT (EXPORT)
// ==========================================

export async function downloadPdfAction(id: string): Promise<{ success: boolean; blob?: Blob; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée" };
  const baseUrl = apiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur PDF");
    const blob = await res.blob();
    return { success: true, blob };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ==========================================
// 6. ACTIONS DE FILTRAGE (FILTER) – Utilitaires
// ==========================================

export async function filtersToUrlParams(filters: InvoiceFilters): Promise<URLSearchParams> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  return params;
}

export async function urlParamsToFilters(urlParams: URLSearchParams): Promise<InvoiceFilters> {
  const filters: InvoiceFilters = {};
  for (const [key, value] of urlParams.entries()) {
    if (value) {
      if (key === "minAmount" || key === "maxAmount") (filters as any)[key] = parseFloat(value);
      else if (key === "page" || key === "limit") (filters as any)[key] = parseInt(value);
      else (filters as any)[key] = value;
    }
  }
  return filters;
}

// ========================================== 
// 7. ACTIONS POUR STATISTIQUES AVANCÉES
// ==========================================

export async function getSalesAnalyticsAction(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const stats = await getInvoiceStatsAction(period);
  if (!stats.success) return { success: false, message: stats.message, data: null };
  return {
    success: true,
    data: {
      summary: stats.data?.summary || {},
      byStatus: stats.data?.byStatus || [],
      topClients: stats.data?.topClients || [],
      period: stats.data?.period || { type: period },
    },
  };
}

export async function getPaymentForecastAction() {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Session expirée", data: null };

  try {
    const [overdueRes, statsRes] = await Promise.all([
      apiRequest("/invoices/overdue?limit=100"),
      apiRequest("/invoices/stats?period=month"),
    ]);

    const overdueInvoices = overdueRes.data || [];
    const stats = statsRes.data || {};
    const totalDue = stats.summary?.due || 0;
    const overdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.balance || 0), 0);
    const upcomingAmount = totalDue - overdueAmount;

    return {
      success: true,
      data: {
        totalDue,
        overdueAmount,
        upcomingAmount,
        overdueCount: overdueInvoices.length,
        forecast: {
          thisMonth: upcomingAmount * 0.7,
          nextMonth: upcomingAmount * 0.3,
        },
      },
    };
  } catch (err) {
    return { success: false, message: "Erreur prévisions", data: null };
  }
}