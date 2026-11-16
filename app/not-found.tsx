import Link from "next/link";

/** 404 for unmatched routes. Without it, Next serves an unstyled default. */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <p className="text-6xl font-black italic tracking-tighter text-zinc-200 dark:text-zinc-800">
          404
        </p>
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">
            الصفحة غير موجودة
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            الرابط الذي طلبته غير موجود أو تم نقله.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition"
        >
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
