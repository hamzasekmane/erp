/**
 * invoice.service.ts
 * Service professionnel pour la gestion des factures dans Velora ERP
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// --- DÉFINITIONS DES TYPES ---

export type DateRangeType = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'last_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_quarter' 
  | 'last_quarter' 
  | 'this_year' 
  | 'last_year' 
  | 'custom';

export type SortField = 'date' | 'dueDate' | 'total' | 'createdAt' | 'invoiceNumber' | 'clientName';
export type SortOrder = 'asc' | 'desc';

export interface InvoiceFilters {
  query?: string;
  status?: string;
  page?: number;
  limit?: number;
  clientId?: string;
  
  // Filtrage Date (Émission)
  dateRange?: DateRangeType;
  startDate?: string; 
  endDate?: string;    
  month?: string;      // Format YYYY-MM
  
  // Filtrage Date (Échéance)
  dueDateRange?: DateRangeType;
  dueStart?: string;
  dueEnd?: string;
  
  // Filtrage Montant
  minAmount?: number;
  maxAmount?: number;
  
  // Relations & Tris
  productId?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  populate?: ('client' | 'items' | 'payments')[];
  fields?: string[];
}

// --- HELPER DE GESTION DES DATES ---

export class DateRangeHelper {
  static getRangeForPreset(preset: DateRangeType): { start: string; end: string } | null {
    const now = new Date();
    let start: Date, end: Date;

    switch (preset) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(yesterday.setHours(0, 0, 0, 0));
        end = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      
      case 'this_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        start = new Date(startOfWeek.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      
      case 'last_week':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - 7);
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - 1);
        start = new Date(lastWeekStart.setHours(0, 0, 0, 0));
        end = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
        break;
      
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        break;
      
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      
      default: return null;
    }

    return { start: start.toISOString(), end: end.toISOString() };
  }

  static getRangeForMonth(month: string): { start: string; end: string } | null {
    const [year, monthNum] = month.split('-').map(Number);
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null;
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  static getRangeLabel(preset: DateRangeType): string {
    const labels: Record<string, string> = {
      today: 'Aujourd\'hui',
      yesterday: 'Hier',
      this_week: 'Cette semaine',
      last_week: 'Semaine dernière',
      this_month: 'Ce mois-ci',
      last_month: 'Mois dernier',
      this_quarter: 'Ce trimestre',
      last_quarter: 'Trimestre dernier',
      this_year: 'Cette année',
      last_year: 'Année dernière',
      custom: 'Personnalisé'
    };
    return labels[preset] || preset;
  }
}

// --- SERVICE FACTURATION ---

export const invoiceService = {
  
  // 1. PUBLIC ROUTES
  async getPublicInvoice(id: string) {
    try {
      const res = await fetch(`${API_URL}/invoices/${id}/view`, { method: "GET", cache: "no-store" });
      return await res.json();
    } catch (error) {
      return { success: false, message: "Erreur de connexion" };
    }
  },

  async downloadPublicPdf(id: string) {
    const res = await fetch(`${API_URL}/invoices/${id}/export/pdf/public`);
    if (!res.ok) throw new Error("Erreur PDF Public");
    return res.blob();
  },

  // 2. PROTECTED READ ROUTES
  async getAllInvoices(token: string, filters: InvoiceFilters = {}) {
    const params = new URLSearchParams();
    
    // Filtres de base
    if (filters.query) params.append("search", filters.query);
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.clientId) params.append("clientId", filters.clientId);
    
    // Gestion Temps (Émission)
    if (filters.dateRange && filters.dateRange !== 'custom') {
      const range = DateRangeHelper.getRangeForPreset(filters.dateRange);
      if (range) { params.append("fromDate", range.start); params.append("toDate", range.end); }
    } else if (filters.month) {
      const range = DateRangeHelper.getRangeForMonth(filters.month);
      if (range) { params.append("fromDate", range.start); params.append("toDate", range.end); }
    } else {
      if (filters.startDate) params.append("fromDate", filters.startDate);
      if (filters.endDate) params.append("toDate", filters.endDate);
    }
    
    // Gestion Temps (Échéance)
    if (filters.dueDateRange && filters.dueDateRange !== 'custom') {
      const range = DateRangeHelper.getRangeForPreset(filters.dueDateRange);
      if (range) { params.append("dueFrom", range.start); params.append("dueTo", range.end); }
    } else {
      if (filters.dueStart) params.append("dueFrom", filters.dueStart);
      if (filters.dueEnd) params.append("dueTo", filters.dueEnd);
    }
    
    if (filters.minAmount !== undefined) params.append("minAmount", filters.minAmount.toString());
    if (filters.maxAmount !== undefined) params.append("maxAmount", filters.maxAmount.toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.populate?.length) params.append("populate", filters.populate.join(','));

    const res = await fetch(`${API_URL}/invoices?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error('Erreur lors de la récupération des factures');
    return res.json();
  },

  async getInvoiceById(id: string, token: string) {
    const res = await fetch(`${API_URL}/invoices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error('Facture introuvable');
    return res.json();
  },

  async getInvoiceStats(token: string, period: string = 'month') {
    const res = await fetch(`${API_URL}/invoices/stats?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 } 
    });
    if (!res.ok) throw new Error('Erreur statistiques');
    return res.json();
  },

  // 3. WRITE ROUTES
  async createInvoice(data: any, token: string) {
    const res = await fetch(`${API_URL}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw { status: res.status, ...result };
    return result;
  },

  async updateInvoice(id: string, data: any, token: string) {
    const res = await fetch(`${API_URL}/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Mise à jour échouée');
    return res.json();
  },

  async deleteInvoice(id: string, token: string) {
    const response = await fetch(`${API_URL}/invoices/${id}`, { 
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Suppression échouée');
    return response.json();
  },

  // 4. ACTIONS & EXPORT
  async sendInvoice(id: string, emailData: any, token: string) {
    const res = await fetch(`${API_URL}/invoices/${id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(emailData),
    });
    return res.json();
  },

  async markAsPaid(id: string, paymentData: any, token: string) {
    const res = await fetch(`${API_URL}/invoices/${id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error('Erreur paiement');
    return res.json();
  },

  async downloadPdf(id: string, token: string) {
    const res = await fetch(`${API_URL}/invoices/${id}/export/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur génération PDF");
    return res.blob();
  },

  // 5. UTILS
  filtersToUrlParams(filters: InvoiceFilters): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    return params.toString();
  }
};