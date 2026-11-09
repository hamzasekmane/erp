"use client";

import { useEffect, useState, use } from "react"; 
import { invoiceService } from "@/app/services/invoice.service";
import InvoiceDownloadBtn from "@/app/components/InvoiceDownloadBtn";
import { 
  User, CreditCard, CheckCircle, 
  FileText, Clock, ShieldCheck, ArrowRight, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";

// --- Interfaces ---
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceDetail {
  _id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'viewed';
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  clientId: {
    name: string;
    email?: string;
  };
}

export default function PublicInvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 
  
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // URL de l'API (à définir dans ton .env.local)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await invoiceService.getPublicInvoice(id);
        if (response?.success && response.data) {
          setInvoice(response.data);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

const handlePayment = async () => {
  if (!invoice || isPaid) return;

  setIsProcessingPayment(true);

  try {
    // تأكد أن المسار في الـ Backend هو: /invoices/:id/pay/public
    // وأنه لا يحتوي على middleware (protect)
    const response = await fetch(`${API_URL}/invoices/${id}/pay/public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: remainingBalance,
        method: "credit_card",
        notes: "Paiement via portail client",
        reference: `PAY-${invoice.invoiceNumber}`
      }),
    });

    const result = await response.json();

    if (result.success) {
      setInvoice((prev) =>
        prev ? { ...prev, status: "paid", paidAmount: prev.total } : null
      );
      alert("Paiement réussi !");
    } else {
      // إذا كانت النتيجة "unauthorized"، ستعرف أن المشكلة في الـ Backend
      alert(result.message || "Erreur de paiement");
    }
  } catch (error) {
    console.error("Payment Error:", error);
    alert("Erreur de connexion au serveur.");
  } finally {
    setIsProcessingPayment(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!invoice) return notFound();

  const remainingBalance = (invoice.total || 0) - (invoice.paidAmount || 0);
  const isPaid = invoice.status === 'paid' || remainingBalance <= 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="max-w-5xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header & Download Bar */}
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none">Document Officiel</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Facture en ligne</p>
              </div>
           </div>
           
           <InvoiceDownloadBtn 
            invoiceId={invoice._id} 
            invoiceNumber={invoice.invoiceNumber} 
            token=""
            isPublic={true}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Invoice Body */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-zinc-900 p-8 md:p-14 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
                <div>
                  <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-zinc-900 dark:text-white mb-6">
                    {invoice.invoiceNumber}
                  </h1>
                  <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                    <Clock size={12} className="text-emerald-500" /> Émis le {format(new Date(invoice.date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <StatusBadge status={invoice.status} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full mb-12">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 italic">
                      <th className="text-left py-4 px-2 tracking-widest">Désignation</th>
                      <th className="text-right py-4 px-2">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="py-6 px-2">
                          <p className="font-bold text-zinc-800 dark:text-zinc-100">{item.description}</p>
                          <p className="text-[10px] text-zinc-400 mt-1 uppercase italic">{item.quantity} x {item.unitPrice.toLocaleString()} DA</p>
                        </td>
                        <td className="py-6 px-2 text-right font-black text-zinc-900 dark:text-white">
                          {(item.quantity * item.unitPrice).toLocaleString()} <span className="text-[9px] text-emerald-500">DA</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="pt-8 border-t-2 border-zinc-50 dark:border-zinc-800/50 flex flex-col items-end">
                <div className="w-full md:w-64 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400">
                    <span>Sous-total</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{(invoice.subtotal || 0).toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="font-black italic uppercase text-emerald-600 text-[11px] tracking-widest">Net à Payer</span>
                    <span className="text-4xl font-black italic text-zinc-900 dark:text-white">
                      {invoice.total?.toLocaleString()} <small className="text-[10px] not-italic text-emerald-600">DA</small>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Client Info */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
              <h4 className="text-[10px] font-black uppercase mb-6 italic text-emerald-600 tracking-widest flex items-center gap-2">
                <User size={14} /> Destinataire
              </h4>
              <p className="font-black text-xl italic text-zinc-900 dark:text-white">{invoice.clientId?.name}</p>
              <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Échéance</p>
                <p className="font-bold text-zinc-900 dark:text-white text-sm">
                  {format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            {/* Payment Box */}
            <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-zinc-800">
              <h4 className="text-[10px] font-black uppercase mb-8 italic opacity-40 tracking-widest flex items-center gap-2">
                <CreditCard size={14} /> Solde & Paiement
              </h4>
              <div className="space-y-8">
                <div>
                  <span className="text-[10px] font-black opacity-40 uppercase block mb-1">
                    {isPaid ? "Montant réglé" : "Reste à régler"}
                  </span>
                  <span className={`text-4xl font-black italic ${isPaid ? "text-emerald-500" : "text-emerald-400"}`}>
                    {remainingBalance.toLocaleString()} <small className="text-[10px] not-italic">DA</small>
                  </span>
                </div>

                {!isPaid ? (
                  <button 
                    disabled={isProcessingPayment}
                    onClick={handlePayment}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isProcessingPayment ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />}
                    <span className="uppercase tracking-tighter text-sm">Payer Maintenant</span>
                    {!isProcessingPayment && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-inner animate-in zoom-in-95 duration-300">
                    <CheckCircle size={22} />
                    <div>
                      <p className="text-[10px] font-black uppercase leading-none mb-1">Payée avec succès</p>
                      <p className="text-[9px] opacity-70 italic font-bold">Merci pour votre confiance</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const styles: Record<string, string> = {
    paid: "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20 shadow-lg",
    sent: "bg-blue-500 text-white border-blue-400",
    viewed: "bg-zinc-900 text-white border-zinc-700",
    overdue: "bg-rose-500 text-white border-rose-400 animate-pulse shadow-rose-500/30 shadow-lg",
  };
  const labels: Record<string, string> = {
    paid: "Payée", sent: "Envoyée", viewed: "Consultée", draft: "Brouillon", overdue: "En Retard",
  };

  return (
    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase border italic tracking-widest transition-all ${styles[s] || "bg-zinc-100 text-zinc-500"}`}>
      {labels[s] || status}
    </span>
  );
}