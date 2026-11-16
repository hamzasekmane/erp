// app/lib/session.ts
//
// Server-only. It is imported exclusively from Server Actions and route handlers.
// `server-only` makes that a BUILD error rather than a runtime surprise if a
// Client Component ever imports it.
import "server-only";

/**
 * Session cookies and access-token renewal.
 *
 * THE BUG THIS EXISTS FOR
 * -----------------------
 * The API issues an access token valid for `ACCESS_TOKEN_TTL_SECONDS`
 * (1 hour by default), but the web layer stored it in a cookie with a 7-day
 * lifetime and never renewed it. Nothing rejected the token early, so the app
 * looked signed in for a week while every API call returned 401 after the first
 * hour. In practice nobody could stay logged in for a working day.
 *
 * The API already issues a refresh token with a real session record
 * (`POST /auth/refresh`, 30 days, reuse-detection with family revocation), so
 * this uses it instead of inventing a scheme:
 *
 *   * the access token lives in an httpOnly cookie with the SAME lifetime as the
 *     API chose for it,
 *   * the refresh token lives in its own httpOnly cookie, path-scoped to the
 *     refresh route,
 *   * a 401 triggers one renewal attempt and one replay of the original request.
 *
 * Refresh-token rotation means a successful refresh returns a NEW refresh token,
 * which must be stored again — otherwise the next renewal replays a token that
 * has already been rotated and the server treats it as reuse (it revokes the
 * whole family, which looks exactly like "randomly logged out").
 */

export const ACCESS_COOKIE = "token";
export const REFRESH_COOKIE = "refresh_token";
/** The access token is valid for an hour by default; the cookie must agree. */
export const ACCESS_MAX_AGE = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 3600);
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * `next/headers` is imported lazily rather than at module load: this module is
 * reachable from the shared `apiFetch` graph, which some Client Components pull
 * in, and a static import there fails the whole build.
 */
async function cookieStore() {
  const { cookies } = await import("next/headers");
  return cookies();
}

function baseOptions() {
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };
}

/** Cookie options for the short-lived access token. */
export function accessCookieOptions() {
  return { ...baseOptions(), httpOnly: true, maxAge: ACCESS_MAX_AGE };
}

/** Cookie options for the refresh token. */
export function refreshCookieOptions() {
  return { ...baseOptions(), httpOnly: true, maxAge: REFRESH_MAX_AGE };
}

/**
 * Stores the pair returned by /auth/login, /auth/register or /auth/refresh.
 *
 * `user`, `tenant` and `tenantId` are display-only cookies read by the UI. They
 * are never trusted for authorisation — the API re-derives the tenant from the
 * token on every request.
 */
export async function storeSession(result: {
  token?: string;
  refreshToken?: string;
  user?: unknown;
  tenant?: { id?: string } | null;
}) {
  const store = await cookieStore();

  if (result.token) store.set(ACCESS_COOKIE, result.token, accessCookieOptions());
  if (result.refreshToken) store.set(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

  const publicOptions = { ...baseOptions(), httpOnly: false, maxAge: REFRESH_MAX_AGE };
  if (result.user) store.set("user", JSON.stringify(result.user), publicOptions);
  if (result.tenant) {
    store.set("tenant", JSON.stringify(result.tenant), publicOptions);
    if (result.tenant.id) store.set("tenantId", result.tenant.id, publicOptions);
  }
}

/** Clears every session cookie. Used by logout and by failed renewal. */
export async function clearSession() {
  const store = await cookieStore();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, "user", "tenant", "tenantId", "user_name"]) {
    store.delete(name);
  }
}

/**
 * Exchanges the refresh token for a new pair and stores it.
 *
 * Returns the new access token, or null when the session is genuinely over
 * (no refresh token, revoked, expired, or the API is unreachable). Callers must
 * treat null as "signed out" — never as "retry later".
 */
export async function renewSession(): Promise<string | null> {
  const store = await cookieStore();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  // Imported lazily: this module is used from middleware-ish contexts where a
  // static import of the API helpers would create a cycle.
  const { apiBaseUrl } = await import("./apiBase");

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    // Network failure is NOT a logout: keep the cookies so a later request can
    // try again. Returning null here would sign the user out on a blip.
    return null;
  }

  if (!response.ok) {
    await clearSession();
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: { token?: string; refreshToken?: string }; token?: string; refreshToken?: string }
    | null;
  const result = payload?.data ?? payload;
  if (!result?.token) {
    await clearSession();
    return null;
  }

  store.set(ACCESS_COOKIE, result.token, accessCookieOptions());
  if (result.refreshToken) store.set(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
  return result.token;
}
