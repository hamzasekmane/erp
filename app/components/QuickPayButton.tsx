"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle, Loader2 } from "lucide-react";

export default function QuickPayButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-900/60 group-hover:translate-y-[-2px]"
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CheckCircle size={16} />
      )}
      {pending ? "Traitement..." : "Marquer comme payée"}
    </button>
  );
}