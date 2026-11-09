"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { paymentService } from "@/app/services/paymentServices";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeletePaymentButton({ id, token }: { id: string; token: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await paymentService.delete(id, token);
      if (res.error) throw new Error("Échec de la suppression");

      toast.success("Paiement supprimé définitivement", {
        style: { borderRadius: '20px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }
      });
      
      // العودة لصفحة القائمة بعد الحذف
      router.push("/dashboard/payment");
      router.refresh();
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full">
          <AlertTriangle size={14} className="text-rose-600" />
          <span className="text-[10px] font-black uppercase italic text-rose-600 tracking-tighter">
            Confirmer la suppression ?
          </span>
        </div>
        
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>

        <button
          onClick={() => setIsConfirming(false)}
          className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full hover:bg-zinc-200"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all group"
    >
      <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
      <span className="text-[10px] font-black uppercase italic tracking-widest">Supprimer</span>
    </button>
  );
}