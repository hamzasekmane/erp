/**
 * Resolves the API base URL for both browser and server runtimes.
 *
 * - Browser: `NEXT_PUBLIC_API_URL` may be relative (e.g. `/api`) because the
 *   Next.js server proxies it to the backend.
 * - Server (RSC / route handlers): a relative URL cannot be fetched, so we
 *   resolve it against `API_INTERNAL_URL` or the `API_PROXY_TARGET` proxy.
 */
export function apiBaseUrl(): string {
  const configured = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  const isServer = typeof window === "undefined";

  if (configured && !configured.startsWith("/")) return configured;

  if (isServer) {
    const proxyTarget = process.env.API_PROXY_TARGET;
    if (proxyTarget) {
      const path = configured && configured.startsWith("/") ? configured : "/api";
      return `${proxyTarget.replace(/\/$/, "")}${path === "/" ? "" : path}`;
    }
  }

  if (configured && isServer) {
    const port = process.env.PORT || "3000";
    return `http://127.0.0.1:${port}${configured}`;
  }

  return "http://localhost:4000/api";
}
