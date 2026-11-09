"use client";

import { useState } from "react";
import { CreditCard, FileText, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceBtnProps {
  invoiceId: string;
  type: 'pay' | 'pdf' | 'send';
}

export default function InvoiceBtn({ invoiceId, type }: InvoiceBtnProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      if (type === 'pdf') {
        toast.info("Génération du document PDF...");
        window.open(`/api/proxy/pdf/${invoiceId}`, '_blank', 'noopener,noreferrer');
      } 
      
      else if (type === 'pay') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success("Statut de paiement mis à jour");
      } 
      
      else if (type === 'send') {
        toast.info("L'envoi par email est en cours...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success("Facture envoyée au client");
      }
    } catch (error) {
      toast.error("Échec de l'opération");
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    pay: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 hover:border-emerald-500",
    pdf: "bg-white/5 text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/30",
    send: "bg-white/5 text-zinc-400 hover:bg-blue-500/10 hover:text-blue-400 border border-white/10 hover:border-blue-500/30"
  };

  const icons = {
    pay: <CreditCard size={15} strokeWidth={2.5} />,
    pdf: <FileText size={15} strokeWidth={2.5} />,
    send: <Send size={15} strokeWidth={2.5} />
  };

  const labels = {
    pay: "Payer",
    pdf: "PDF",
    send: "Envoyer"
  };

  return (
    <button 
      onClick={handleAction}
      disabled={isLoading}
      className={`
        px-4 py-2.5 rounded-xl transition-all active:scale-90
        flex items-center gap-2 font-black text-[10px] 
        uppercase tracking-[0.15em] disabled:opacity-50 
        ${styles[type]}
      `}
    >
      {isLoading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        icons[type]
      )}
      <span>{labels[type]}</span>
    </button>
  );
}