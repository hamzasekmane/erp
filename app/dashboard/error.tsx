"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // يمكنك هنا إرسال الخطأ لخدمة مراقبة مثل Sentry
    console.error('Dashboard boundary error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      {/* أيقونة الخطأ بتصميم مميز */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 blur-2xl rounded-full scale-150" />
        <div className="relative bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-red-100 dark:border-red-900/30 shadow-xl shadow-red-500/10">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">
          عذراً، حدث خطأ فني <span className="text-red-500">!</span>
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
          نواجه صعوبة في تحميل بيانات لوحة التحكم حالياً. قد يكون هذا بسبب مشكلة في الاتصال أو تحديث للنظام.
        </p>
      </div>

      {/* أزرار التحكم */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-10">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-zinc-200 dark:shadow-none"
        >
          <RefreshCcw size={18} className={ "animate-spin-slow" } />
          تحديث الصفحة
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          <Home size={18} />
          الرئيسية
        </Link>
      </div>

      {/* رقم تعريف الخطأ للمساعدة الفنية */}
      {error.digest && (
        <p className="mt-8 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}