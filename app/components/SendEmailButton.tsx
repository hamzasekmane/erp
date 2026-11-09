"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { sendInvoiceAction } from "@/app/actions/invoiceActions";
import { toast } from "sonner";

// On définit l'interface pour inclure 'disabled'
interface SendEmailButtonProps {
  id: string;
  disabled?: boolean; 
}

export default function SendEmailButton({ id, disabled }: SendEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    // Sécurité supplémentaire : on ne fait rien si désactivé
    if (disabled || isSending) return;

    setIsSending(true);
    try {
      const result = await sendInvoiceAction(null, { id, data: { sendEmail: true } });
      if (result.success) {
        toast.success(result.message || "Email envoyé avec succès");
      } else {
        toast.error(result.message || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button 
      onClick={handleSend}
      // Le bouton est désactivé si l'envoi est en cours OU si la prop disabled est vraie
      disabled={isSending || disabled}
      className={`
        flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 
        rounded-xl font-black text-[10px] uppercase transition-all
        ${disabled || isSending
          ? "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 cursor-not-allowed border border-transparent"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600"
        }
      `}
    >
      {isSending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Send size={14} />
      )}
      {isSending ? "Envoi..." : "Envoyer Email"}
    </button>
  );
}