import { apiBaseUrl } from "@/app/lib/apiBase";
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

export async function apiFetch<T>(
  endpoint: string,
  token?: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = apiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Create headers as a plain object first
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);

    let result;
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      result = await res.json();
    } else {
      result = await res.text();
    }

    if (!res.ok) {
      throw new ApiError(
        result?.message || "Erreur API",
        res.status,
        result?.error_code,
        result?.data
      );
    }

    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    throw new ApiError(
      error instanceof Error ? error.message : "Erreur réseau",
      500
    );
  }
}