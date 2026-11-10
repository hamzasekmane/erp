import { apiBaseUrl } from "@/app/lib/apiBase";
const API_URL = apiBaseUrl();

export interface ClientNote {
  _id: string;
  title?: string;
  clientId: string | any;
  content: string;
  isPinned?: boolean;
  type: 'general' | 'important' | 'reminder' | 'follow-up';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesResponse {
  data: ClientNote[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
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

  let result;
  try {
    result = await res.json();
  } catch {
    result = { message: "Failed to parse JSON response" };
  }

  if (!res.ok) {
    // For 403 errors, even with empty body, assume it might be subscription expired
    if (res.status === 403) {
      // Check if the result contains error_code, otherwise create a default
      const error = {
        error_code: result?.error_code || "SUBSCRIPTION_EXPIRED", // Default to SUBSCRIPTION_EXPIRED for 403
        message: result?.message || "Accès interdit - Abonnement可能 expiré",
        data: result?.data || null,
        status: res.status
      };
      
      throw error;
    }
    // For other errors, throw a structured error
    const error = {
      error_code: result?.error_code || "API_ERROR",
      message: result?.message || `Erreur API: ${res.status}`,
      data: result?.data || null,
      status: res.status
    };
    console.error(`❌ API Error ${res.status} for ${endpoint}:`, error);
    throw error;
  }

  return result;
}

export const clientNoteService = {
  async getAllNotes(token: string, query = ""): Promise<NotesResponse> {
    try {
      const queryString = query ? (query.startsWith('?') ? query : `?${query}`) : "";
      console.log(`Fetching notes from: /client-notes${queryString}`);
      
      const result = await apiFetch<any>(`/client-notes${queryString}`, token);
      
      return {
        data: result.data || [],
        pagination: result.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      };
    } catch (error) {
      throw error;
    }
  },

  async getNoteById(id: string, token: string): Promise<ClientNote | null> {
    try {
      const result = await apiFetch<any>(`/client-notes/${id}`, token);
      return result.data ?? null;
    } catch (error) {
      console.error(`Error in getNoteById ${id}:`, error);
      return null;
    }
  },

  async getNotesByClient(clientId: string, token: string): Promise<ClientNote[]> {
    try {
      const result = await apiFetch<any>(`/client-notes/client/${clientId}`, token);
      return result.data || [];
    } catch (error) {
      console.error(`Error in getNotesByClient ${clientId}:`, error);
      throw error;
    }
  },

  async createNote(token: string, noteData: Partial<ClientNote>): Promise<ClientNote | null> {
    try {
      const result = await apiFetch<any>('/client-notes', token, {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
      return result.data || null;
    } catch (error) {
      console.error("Error in createNote:", error);
      throw error;
    }
  },

  async updateNote(id: string, token: string, noteData: Partial<ClientNote>): Promise<ClientNote | null> {
    try {
      const result = await apiFetch<any>(`/client-notes/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(noteData)
      });
      return result.data || null;
    } catch (error) {
      console.error(`Error in updateNote ${id}:`, error);
      throw error;
    }
  },

  async deleteNote(id: string, token: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/client-notes/${id}`, token, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error(`Error in deleteNote ${id}:`, error);
      throw error;
    }
  }
};