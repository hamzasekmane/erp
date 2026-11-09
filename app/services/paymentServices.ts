// app/services/paymentServices.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  method?: string;
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export interface StatsOptions {
  period?: string;      // "day" | "week" | "month" | "year"
  offset?: number;      // number of periods to shift (for comparison)
  groupBy?: string;     // "day" | "week" | "month" | "quarter" | "year"
  limit?: number;       // max number of groups to return
}

export const paymentService = {
  // ==============================
  // Payment CRUD Operations
  // ==============================

  /**
   * Get all payments with filters and pagination
   * GET /api/payments
   */
  getAll: async (token: string, filters: PaymentFilters = {}) => {
    try {
      const { search, status, method, page = 1, limit = 10, fromDate, toDate } = filters;
      
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (status) query.append("status", status);
      if (method) query.append("method", method);
      if (fromDate) query.append("fromDate", fromDate);
      if (toDate) query.append("toDate", toDate);
      query.append("page", page.toString());
      query.append("limit", limit.toString());

      const res = await fetch(`${API_URL}/payments?${query.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        console.warn("Payment endpoint returned HTML - using mock data");
        return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }

      if (!res.ok) {
        console.error(`❌ Payment API Error: ${res.status}`);
        return { success: false, data: [], error: `HTTP ${res.status}` };
      }

      const result = await res.json();
      return {
        success: true,
        data: result.data || result,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("❌ Fetch failed:", error);
      return { success: false, data: [], error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Alias for getAll
   */
  getAllPayments: async (token: string, filters?: PaymentFilters): Promise<ApiResponse<any>> => {
    return paymentService.getAll(token, filters || {});
  },

  /**
   * Get a single payment by ID
   * GET /api/payments/:id
   */
  getPaymentById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      
      if (!res.ok) return null;
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) return null;
      
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      console.error("Error fetching payment by ID:", error);
      return null;
    }
  },

  /**
   * Create a new payment
   * POST /api/payments
   */
  create: async (data: any, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      return { success: res.ok, data: result.data || result, message: result.message };
    } catch (error) {
      console.error("Error creating payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Alias for create
   */
  createPayment: async (
    token: string,
    paymentData: {
      invoiceId: string;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> => {
    return paymentService.create(paymentData, token);
  },

  /**
   * Update payment metadata
   * PUT /api/payments/:id
   */
  update: async (id: string, data: any, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      return { success: res.ok, data: result.data || result, message: result.message };
    } catch (error) {
      console.error("Error updating payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Delete a payment
   * DELETE /api/payments/:id
   */
  delete: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      return { success: res.ok, message: result.message };
    } catch (error) {
      console.error("Error deleting payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Process a refund for a payment
   * POST /api/payments/:id/refund
   */
  processRefund: async (token: string, paymentId: string, amount: number, reason?: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du remboursement");
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error("Error processing refund:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  },

  /**
   * Reconcile a payment
   * PATCH /api/payments/:id/reconcile
   */
  reconcilePayment: async (paymentId: string, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/${paymentId}/reconcile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reconciled: true }),
      });
      return res.ok;
    } catch (error) {
      console.error("Error reconciling payment:", error);
      return false;
    }
  },

  // ==============================
  // Statistics & Reports
  // ==============================

  /**
   * Get payment statistics (summary, daily breakdown)
   * GET /api/payments/stats
   */
  getStats: async (token: string, options: StatsOptions = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.period) params.append("period", options.period);
      if (options.offset !== undefined) params.append("offset", String(options.offset));
      if (options.groupBy) params.append("groupBy", options.groupBy);
      if (options.limit) params.append("limit", String(options.limit));
      
      const queryString = params.toString();
      const url = `${API_URL}/payments/stats${queryString ? `?${queryString}` : ""}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      
      if (!res.ok) return { summary: null, methods: [], daily: [] };
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        return { summary: null, methods: [], daily: [] };
      }
      
      const result = await res.json();
      return result.data || result || { summary: null, methods: [], daily: [] };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return { summary: null, methods: [], daily: [] };
    }
  },

  /**
   * Alias for getStats (backward compatible)
   */
  getPaymentStats: async (token: string, options: StatsOptions = {}): Promise<ApiResponse<any>> => {
    const stats = await paymentService.getStats(token, options);
    return {
      success: true,
      data: stats,
    };
  },

  // ==============================
  // Payment Gateways & Methods
  // ==============================

  /**
   * Get available payment gateways
   * GET /api/payments/settings/gateways
   */
  getGateways: async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/settings/gateways`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      
      if (!res.ok) return [];
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) return [];
      
      const result = await res.json();
      return result.data || result || [];
    } catch (error) {
      console.error("Error fetching gateways:", error);
      return [];
    }
  },

  /**
   * Toggle a payment gateway active status
   * PATCH /api/payments/settings/gateways/:id/toggle
   */
  toggleGateway: async (id: string, status: boolean, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/settings/gateways/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message };

      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error("Error toggling gateway:", error);
      return { success: false, message: "Network error" };
    }
  },

  /**
   * Update gateway configuration
   * PUT /api/payments/settings/gateways/:id
   */
  updateGatewayConfig: async (id: string, config: any, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/settings/gateways/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      return { success: res.ok, data: data.data, message: data.message };
    } catch (error) {
      console.error("Error updating gateway config:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Setup a new payment gateway
   * POST /api/payments/settings/gateways/setup
   */
  setupGateway: async (token: string, gatewayData: { code: string; config: any; isActive?: boolean }): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/payments/settings/gateways/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gatewayData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error("Error setting up gateway:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  },

  /**
   * Get payment methods (simpler list for dropdowns)
   * GET /api/payments/settings/methods
   */
  getPaymentMethods: async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/settings/methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching methods:", error);
      return [];
    }
  },

  /**
   * Toggle a payment method active status
   * PATCH /api/payments/settings/methods/:id/toggle
   */
  togglePaymentMethod: async (methodId: string, isActive: boolean, token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/settings/methods/${methodId}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });
      return res.ok;
    } catch (error) {
      console.error("Error toggling method:", error);
      return false;
    }
  },

  // ==============================
  // Export (large data fetch)
  // ==============================

  /**
   * Get all payments for export (large limit)
   * GET /api/payments?limit=1000&...
   */
  getAllForExport: async (token: string, filters: { search?: string; status?: string; method?: string } = {}) => {
    try {
      const { search, status, method } = filters;
      
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (status) query.append("status", status);
      if (method) query.append("method", method);
      query.append("limit", "1000");

      const res = await fetch(`${API_URL}/payments?${query.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(`❌ Export API Error: ${res.status}`);
        return [];
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) return [];

      const result = await res.json();
      return result.data || result || [];
    } catch (error) {
      console.error("❌ Export fetch failed:", error);
      return [];
    }
  },
  
};