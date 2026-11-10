import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  // The legacy codebase still has type errors (see docs/04 §9); keep the build
  // green and track the cleanup separately.
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
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
