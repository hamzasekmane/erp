"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { invoiceService } from "@/app/services/invoice.service";
import { toast } from "sonner";

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  token?: string;
  isPublic?: boolean;
  className?: string;
}

export default function InvoiceDownloadBtn({ 
  invoiceId, 
  invoiceNumber, 
  token, 
  isPublic,
  className = "p-2.5 bg-white/5 hover:bg-indigo-500/20 rounded-xl transition-all group/btn"
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      let blob;

      if (isPublic) {
        blob = await invoiceService.downloadPublicPdf(invoiceId);
      } else {
        if (!token) throw new Error("Token manquant");
        blob = await invoiceService.downloadPdf(invoiceId, token);
      }
      
      if (!blob) throw new Error("Blob vide");

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Facture-${invoiceNumber}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={className}
      title={`Télécharger ${invoiceNumber}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin text-zinc-400" />
      ) : (
        <Download size={16} className="text-zinc-400 group-hover/btn:text-indigo-400" />
      )}
    </button>
  );
}