// frontend/app/providers.tsx
"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Theme provider for the app.
 *
 * THERE IS DELIBERATELY NO "mounted" GATE HERE.
 *
 * A previous version returned `children` unwrapped until an effect flipped a
 * `mounted` flag, then rendered `ThemeProvider`. That caused a development error
 * on every page load:
 *
 *   Encountered a script tag while rendering React component.
 *   Scripts inside React components are never executed when rendering on the
 *   client.
 *
 * `next-themes` emits its no-flash bootstrap as an inline `<script>`. React 19
 * only allows a component to render a script tag when `type` is a data-block
 * MIME type (see `isScriptDataBlock` in react-dom): `application/json`,
 * `text/plain`, ... are fine; an executable script is not. `next-themes` 0.4.6
 * passes no `type`, so the tag is rejected.
 *
 * While the gate was closed the provider — and therefore the script — was absent
 * from the server HTML. The gate opened in an effect, i.e. after hydration, so
 * the script was created by the CLIENT renderer, which is exactly the case React
 * warns about, on every page load.
 *
 * Removing the gate fixes the error and a second defect the gate was hiding: the
 * bootstrap never ran before first paint, so a dark-mode user saw a light flash
 * on every hard navigation. Now the script is part of the server HTML and runs
 * before paint, and the client never renders it.
 *
 * No consumer needs the gate: `useTheme()` returns `undefined` on the server and
 * the resolved value after mount, so a component that renders theme-dependent
 * markup must guard itself regardless. The two consumers in this app already do
 * — `Navbar` with a `mounted` flag and `DashboardCharts` with an `isClient` flag —
 * and both render a stable placeholder until then, so server and first client
 * render agree and hydration is clean.
 *
 * Do NOT "fix" a future warning like this by passing
 * `scriptProps={{ type: "application/json" }}`. That silences React by turning
 * the bootstrap into inert data: the tag renders but never executes, so the theme
 * is applied only after hydration and the flash comes back.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}
