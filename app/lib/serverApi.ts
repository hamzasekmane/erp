import { cookies } from "next/headers";
import { apiFetch } from "./apiFetch";

/**
 * Fetch helper for React Server Components: reads the auth cookie and returns
 * `null` instead of throwing so pages can degrade gracefully.
 */
export async function serverApi<T>(endpoint: string): Promise<T | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    return await apiFetch<T>(endpoint, token);
  } catch {
    return null;
  }
}
