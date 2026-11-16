/**
 * Root loading state. Rendered while a route segment streams in, so a slow page
 * shows a skeleton instead of a frozen screen with no feedback.
 *
 * Deliberately minimal: it must not fetch anything or depend on the theme
 * provider, since it can render before either is ready.
 */
export default function RootLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white animate-spin"
          role="status"
          aria-label="جارٍ التحميل"
        />
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          جارٍ التحميل
        </p>
      </div>
    </main>
  );
}
