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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiFetch<T>(
  endpoint: string,
  token?: string,
  options?: RequestInit
): Promise<T> {

  let res: Response;

  try {
    res = await fetch(`${API_URL}${endpoint}`, {
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