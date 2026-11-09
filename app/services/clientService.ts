import {
  ClientSchema,
  ClientStatsSchema,
  Client,
  ClientStats,
  ClientFullDetails,
  ClientsResponse,
  CreateClient,
  UpdateClient
} from "@/app/types/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const IS_DEV = process.env.NODE_ENV === "development";

export interface ApiError {
  error_code: string;
  message: string;
  data?: any;
  status: number;
}

export class SubscriptionExpiredError extends Error {
  error_code = "SUBSCRIPTION_EXPIRED";
  data?: any;

  constructor(message: string, data?: any) {
    super(message);
    this.name = "SubscriptionExpiredError";
    this.data = data;
  }
}

async function apiFetch<T>(
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  let result: any;

  try {
    result = await res.json();
  } catch {
    throw {
      error_code: "INVALID_RESPONSE",
      message: "Réponse invalide du serveur",
      status: res.status,
    };
  }

  if (!res.ok) {
    if (res.status === 403 && result?.error_code === "SUBSCRIPTION_EXPIRED") {
      throw new SubscriptionExpiredError(
        result?.message || "انتهت صلاحية الباقة",
        result?.data
      );
    }

    if (res.status === 401) {
      throw {
        error_code: "UNAUTHORIZED",
        message: "Non authentifié",
        status: 401,
      };
    }

    throw {
      error_code: result?.error_code || "API_ERROR",
      message: result?.message || `Erreur ${res.status}`,
      data: result?.data,
      status: res.status,
    };
  }

  return result;
}

export const clientService = {
  async getAllClients(token: string, query = ""): Promise<ClientsResponse> {
    const queryString = query ? (query.startsWith("?") ? query : `?${query}`) : "";
    const result = await apiFetch<any>(`/clients${queryString}`, token);

    return {
      data: result?.data || [],
      pagination: result?.pagination || { total: 0, page: 1, limit: 10, pages: 1 },
    };
  },

  async getClientById(id: string, token: string): Promise<Client | null> {
    const result = await apiFetch<any>(`/clients/${id}`, token);
    return result?.data || null;
  },

  async getFullDetails(id: string, token: string): Promise<ClientFullDetails | null> {
    const [clientResult, statsResult] = await Promise.allSettled([
      apiFetch<any>(`/clients/${id}`, token),
      apiFetch<any>(`/clients/${id}/stats`, token),
    ]);

    if (clientResult.status === "rejected") {
      if (clientResult.reason instanceof SubscriptionExpiredError) {
        throw clientResult.reason;
      }
      return null;
    }

    const clientData = clientResult.value;
    const statsData = statsResult.status === "fulfilled" ? statsResult.value : null;

    try {
      const profile = ClientSchema.parse(clientData.data);
      const stats = statsData?.data
        ? ClientStatsSchema.parse(statsData.data)
        : null;

      return { profile, stats };
    } catch (validationError) {
      if (IS_DEV) console.error("Validation error:", validationError);

      return {
        profile: clientData.data as Client,
        stats: statsData?.data as ClientStats | null,
      };
    }
  },

  async getClientInvoices(id: string, token: string) {
    const result = await apiFetch<any>(`/clients/${id}/invoices`, token);
    return { data: result?.data || [] };
  },

  async createClient(token: string, clientData: CreateClient) {
    const result = await apiFetch<any>("/clients", token, {
      method: "POST",
      body: JSON.stringify(clientData),
    });

    return result?.data || null;
  },

  async updateClient(id: string, token: string, clientData: UpdateClient) {
    const result = await apiFetch<any>(`/clients/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });

    return result?.data || null;
  },

  async deleteClient(id: string, token: string) {
    await apiFetch(`/clients/${id}`, token, { method: "DELETE" });
    return true;
  },

  async checkCodeAvailability(
    code: string,
    token: string,
    clientId?: string
  ) {
    const url = `/clients/check-code?code=${encodeURIComponent(code)}${
      clientId ? `&clientId=${clientId}` : ""
    }`;

    return apiFetch<{ available: boolean; error?: string }>(url, token);
  },

  async checkEmailAvailability(
    email: string,
    token: string,
    clientId?: string
  ) {
    const url = `/clients/check-email?email=${encodeURIComponent(email)}${
      clientId ? `&clientId=${clientId}` : ""
    }`;

    return apiFetch<{ available: boolean; error?: string }>(url, token);
  },

  async getCategories() {
    return [
      { value: "vip", label: "VIP" },
      { value: "regular", label: "Régulier" },
      { value: "wholesale", label: "Grossiste" },
      { value: "retail", label: "Détaillant" },
    ];
  },

  async getTypes() {
    return [
      { value: "individual", label: "Particulier" },
      { value: "company", label: "Entreprise" },
    ];
  },
};