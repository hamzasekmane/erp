import "server-only";
import { cookies } from "next/headers";
import { apiFetch, ApiError } from "./apiFetch";

/**
 * Fetch helper for React Server Components: reads the auth cookie and returns
 * `null` instead of throwing so pages can degrade gracefully.
 *
 * Token renewal lives HERE rather than in `apiFetch`, because `apiFetch` is
 * shared with the browser: it is imported by services that Client Components
 * pull in, and pulling `next/headers` into that graph fails the build (Turbopack
 * is right to refuse — the cookie jar does not exist in the browser).
 *
 * WHY RENEWAL IS NEEDED AT ALL
 * ----------------------------
 * The access token is valid for an hour (`ACCESS_TOKEN_TTL_SECONDS`). The session
 * is valid for 30 days. Without renewal, every page a user opens after the first
 * hour fails as "not authenticated" even though they are still signed in — the
 * H6 defect in docs/audit/AUDIT.md, which made the app unusable for a working
 * day.
 *
 * Retried ONCE, deliberately: a retry loop would hammer the API with a token
 * that renewal cannot fix (revoked user, bumped token version).
 */
export async function serverApi<T>(endpoint: string): Promise<T | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  try {
    return await apiFetch<T>(endpoint, token);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : undefined;
    if (status !== 401) return null;

    // Expired access token: refresh it and replay once. `renewSession` clears the
    // cookies itself when the session is genuinely over.
    const { renewSession } = await import("./session");
    const renewed = await renewSession();
    if (!renewed) return null;

    try {
      return await apiFetch<T>(endpoint, renewed);
    } catch {
      return null;
    }
  }
}

/**
 * Distinguishes "not signed in" from "the API is unavailable".
 *
 * `serverApi` returns `null` for both, which is fine for a page that just wants
 * to render nothing, but it makes an outage indistinguishable from a logout: the
 * page shows an empty list and the user assumes their data is gone. A page that
 * can tell the difference should use this and render an honest error state.
 *
 * Returns the error code so a caller can branch without importing ApiError.
 */
export type ServerApiResult<T> =
  | { status: "ok"; data: T }
  | { status: "unauthenticated" }
  | { status: "unavailable"; message: string };

export async function serverApiResult<T>(endpoint: string): Promise<ServerApiResult<T>> {
  const token = (await cookies()).get("token")?.value;
  const refreshToken = (await cookies()).get("refresh_token")?.value;
  if (!token && !refreshToken) return { status: "unauthenticated" };

  try {
    const data = await apiFetch<T>(endpoint, token);
    return { status: "ok", data };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      return { status: "unavailable", message: "Erreur inattendue" };
    }
    if (error.status === 401) {
      const { renewSession } = await import("./session");
      const renewed = await renewSession();
      if (!renewed) return { status: "unauthenticated" };
      try {
        return { status: "ok", data: await apiFetch<T>(endpoint, renewed) };
      } catch {
        return { status: "unauthenticated" };
      }
    }
    return { status: "unavailable", message: error.message };
  }
}
