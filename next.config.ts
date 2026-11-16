import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * Notes on the choices, because a CSP that is silently too strict breaks the app
 * and one that is too loose protects nothing:
 *
 *  * `script-src 'unsafe-inline'` is required today. Next injects its bootstrap
 *    and RSC payload as inline scripts, and the theme provider adds another. A
 *    nonce-based policy is the right end state and is tracked in
 *    docs/audit/AUDIT.md (§12, 1.3); moving to it requires threading the nonce
 *    through the root layout. Until then this still blocks the two things that
 *    matter most: script injection from a third-party origin, and `eval`.
 *  * `'unsafe-eval'` is only allowed in development — React Refresh needs it.
 *  * `connect-src` allows the API origin and websockets (socket.io is a
 *    dependency).
 *  * `frame-ancestors 'none'` is the clickjacking defence; it is the CSP
 *    equivalent of X-Frame-Options and is honoured by modern browsers.
 */
function contentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const apiTarget = process.env.API_PROXY_TARGET;
  const connect = new Set(["'self'", "https:", "wss:"]);
  if (isDev) {
    connect.add("http:");
    connect.add("ws:");
  }
  if (apiTarget) {
    try {
      connect.add(new URL(apiTarget).origin);
    } catch {
      // A malformed target is caught at fetch time; do not break the build here.
    }
  }

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${[...connect].join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  // Type errors are blocking: `npm run build` fails on any regression.
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    unoptimized: true,
  },

  /**
   * Security headers.
   *
   * The API sets its own (helmet in server/src/main.ts) but those only cover API
   * responses — the pages users actually load had none of these.
   *
   * `X-Frame-Options: DENY` is kept alongside `frame-ancestors` because older
   * browsers ignore the CSP directive.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy() },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },

  // Same-origin proxy: the browser calls /api and Next forwards to the API.
  // Set API_PROXY_TARGET at build time (e.g. http://api:4000 in Docker).
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
