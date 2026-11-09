"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-900 dark:text-white hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-700 transition-all active:scale-95"
    >
      <Printer size={14} /> Imprimer le Reçu
    </button>
  );
}