"use client";

/**
 * Catches errors thrown in the ROOT layout itself, where `app/error.tsx` cannot
 * help because the layout that would render it is the thing that failed.
 *
 * Next requires this file to render its own <html> and <body>: no layout wraps
 * it. Styling is therefore inline — the global stylesheet may not have loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Root layout error:", error.digest ?? error.message, error);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#ffffff",
          color: "#18181b",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 0.75rem" }}>
            تعذّر تحميل التطبيق
          </h1>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "#71717a", margin: "0 0 1.5rem" }}>
            حدث خطأ في تحميل التطبيق. أعد تحميل الصفحة للمتابعة.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#a1a1aa", margin: "0 0 1.25rem" }}>
              {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#18181b",
              color: "#ffffff",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
