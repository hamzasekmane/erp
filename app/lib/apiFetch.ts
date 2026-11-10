// app/lib/apiFetch.ts

export class ApiError extends Error {
  status?: number;
  error_code?: string;
  data?: any;

  constructor(message: string, status?: number, error_code?: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.error_code = error_code;
    this.data = data;
  }
}

import { apiBaseUrl } from "./apiBase";

/**
 * Resolved on every call so that the browser (`/api`, proxied) and the server
 * (`API_INTERNAL_URL` / `API_PROXY_TARGET`) each use a valid base URL.
 */
function apiUrl(): string {
  return apiBaseUrl();
}

export async function apiFetch<T>(
  endpoint: string,
  token?: string,
  options?: RequestInit
): Promise<T> {

  let res: Response;

  try {
    res = await fetch(`${apiUrl()}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new ApiError(
      "Network error. Impossible de contacter le serveur."
    );
  }

  let result: any;

  try {
    result = await res.json();
  } catch {
    throw new ApiError(
      "Réponse invalide du serveur",
      res.status
    );
  }

  if (!res.ok) {
    // FIX: Use the actual error message from the API, not a hardcoded string
    throw new ApiError(
      result?.message || "Erreur API",  // ← Use the actual message
      res.status,
      result?.error_code,
      result?.data
    );
  }

  return result?.data ?? result;
}