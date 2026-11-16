"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root error boundary.
 *
 * Without this file, anything thrown outside `app/dashboard` (the public pages,
 * login, register, checkout) unmounts the whole React tree and the user gets a
 * blank white page with no way back — the single worst failure mode to ship.
 *
 * It must not depend on the dashboard layout, the session or any data fetching:
 * when this renders, those may be exactly what failed.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console so a production incident has a thread to
    // pull. `digest` is the only identifier available for a server-side throw.
    console.error("Route error:", error.digest ?? error.message, error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
          <span className="text-3xl" aria-hidden="true">
            !
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">
            خطأ غير متوقع
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            تعذّر تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى، وإذا استمرت المشكلة
            فأعد تحميل الصفحة.
          </p>
          {error.digest ? (
            <p className="text-[11px] font-mono text-zinc-400 pt-1">
              مرجع الخطأ: {error.digest}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
