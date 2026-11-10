import { cookies } from "next/headers";
import { invoiceService } from "@/app/services/invoice.service";
import InvoiceDownloadBtn from "@/app/components/InvoiceDownloadBtn";
import QuickPayButton from "@/app/components/QuickPayButton";
import SendEmailButton from "@/app/components/SendEmailButton";
import { 
  ArrowLeft, Calendar, User, CreditCard, CheckCircle, 
  FileText, AlertCircle, Clock, ShieldCheck, Mail
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateInvoiceStatusAction } from "@/app/actions/invoiceActions";
import { refreshInvoicePaymentsAction } from "@/app/actions/chargilyActions";
import ChargilyPayPanel from "@/app/components/ChargilyPayPanel";

// --- Types ---
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceDetail {
  _id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  updatedAt: string;
  clientId: {
    name: string;
    email?: string;
  };
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 0. Retour depuis Chargily : on ne fait pas confiance au redirect, on
  //    revérifie le statut côté serveur auprès du fournisseur.
  let paymentFlash: "paid" | "pending" | "failed" | null = null;
  if (payment === "failed") paymentFlash = "failed";
  if (payment === "success") {
    const check = await refreshInvoicePaymentsAction(id);
    paymentFlash = check.status === "paid" ? "paid" : "pending";
  }

  // 1. Récupération des données avec gestion d'erreur
  const response = await invoiceService.getInvoiceById(id, token);
  if (!response?.success || !response?.data) return notFound();
  
  const invoice: InvoiceDetail = response.data;
  const remainingBalance = (invoice.total || 0) - (invoice.paidAmount || 0);
  const clientEmail = invoice.clientId?.email;

  /**
   * Action Serveur : Marquer comme payée instantanément
   */
  async function handleQuickPay() {
    "use server";
    try {
      // Appel de l'action serveur existante
      await updateInvoiceStatusAction(null, { id, status: 'paid' });
      
      // Purge du cache pour mettre à jour l'interface
      revalidatePath(`/dashboard/invoices/${id}`);
      revalidatePath("/dashboard/invoices");
    } catch (error) {
      console.error("Erreur mise à jour paiement:", error);
    }
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-1 md:p-1 max-w-6xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* 1. HEADER & ACTIONS NAVIGATION */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <Link 
          href="/dashboard/invoices" 
          className="group flex items-center gap-3 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors font-black uppercase text-[10px] tracking-[0.2em]"
        >
          <div className="p-2 rounded-full bg-[var(--card-bg)] border border-[var(--border)] group-hover:bg-[var(--accent)]/20 group-hover:border-[var(--accent)]/30 transition-all">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          </div>
          Retour à la liste
        </Link>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <InvoiceDownloadBtn 
            invoiceId={invoice._id} 
            invoiceNumber={invoice.invoiceNumber} 
            token={token} 
          />
          <SendEmailButton id={invoice._id} disabled={!clientEmail} />
        </div>
      </div>

      {/* 2. BANNIÈRE D'ALERTE (SI RETARD) */}
      {invoice.status === 'overdue' && (
        <div className="relative w-full p-6 bg-rose-500/10 border border-rose-500/30 rounded-[2.5rem] flex items-center gap-5 text-rose-400 backdrop-blur-sm">
          <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/40">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="font-black uppercase text-[12px] tracking-widest leading-none mb-1">Attention : Retard de paiement</p>
            <p className="text-[11px] font-bold opacity-70">
              Le paiement aurait dû être reçu le {format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: fr })}.
            </p>
          </div>
        </div>
      )}

      {/* 2bis. RETOUR DE LA PASSERELLE DE PAIEMENT */}
      {paymentFlash && (
        <div
          className={`relative w-full p-5 sm:p-6 rounded-[2.5rem] border flex items-center gap-4 backdrop-blur-sm ${
            paymentFlash === "paid"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : paymentFlash === "failed"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
          }`}
        >
          <div className="p-2.5 rounded-2xl bg-current/10">
            {paymentFlash === "paid" ? <CheckCircle size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <p className="font-black uppercase text-[11px] tracking-widest leading-none mb-1">
              {paymentFlash === "paid"
                ? "Paiement confirmé"
                : paymentFlash === "failed"
                  ? "Paiement non abouti"
                  : "Paiement en cours de vérification"}
            </p>
            <p className="text-[11px] font-bold opacity-70">
              {paymentFlash === "paid"
                ? "La facture a été soldée après vérification du statut auprès de Chargily."
                : paymentFlash === "failed"
                  ? "Aucun paiement n'a été enregistré. Vous pouvez réessayer."
                  : "Chargily n'a pas encore confirmé la transaction. Actualisez la page dans quelques instants."}
            </p>
          </div>
        </div>
      )}

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 3. COLONNE PRINCIPALE : CORPS DE LA FACTURE */}
        <div className="lg:col-span-8">
          <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 md:p-14 rounded-[4rem] border border-[var(--border)] shadow-2xl relative overflow-hidden">
            
            {/* Filigrane décoratif */}
            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none select-none">
              <FileText size={320} />
            </div>

            {/* En-tête Facture */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-20 relative z-10 gap-8">
              <div>
                <div className="h-14 w-14 bg-gradient-to-br from-[var(--accent)] to-blue-600 rounded-2xl mb-8 flex items-center justify-center text-white font-black italic shadow-xl shadow-[var(--accent)]/20 transform -rotate-3">
                  INV
                </div>
                <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none text-[var(--foreground)]">
                  {invoice.invoiceNumber}
                </h1>
                <div className="flex items-center gap-4 mt-6">
                   <p className="text-[var(--foreground-muted)] font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                    <Clock size={12} className="text-[var(--accent)]" /> Émis le {format(new Date(invoice.date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <StatusBadge status={invoice.status} />
            </div>

            {/* Table des articles */}
            <div className="overflow-x-auto relative z-10">
              <table className="w-full mb-16">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-[var(--foreground-muted)] border-b border-[var(--border)] italic">
                    <th className="text-left py-6 px-2 tracking-widest">Désignation</th>
                    <th className="text-center py-6 px-2">Qté</th>
                    <th className="text-right py-6 px-2">Prix Unit.</th>
                    <th className="text-right py-6 px-2">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-[var(--card-bg)] transition-colors">
                      <td className="py-8 px-2">
                        <p className="font-bold text-base text-[var(--foreground)]">{item.description}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)] font-medium uppercase mt-1 italic tracking-wider flex items-center gap-1">
                          <ShieldCheck size={10} className="text-[var(--accent)]/50" /> Service certifié
                        </p>
                       </td>
                      <td className="py-8 px-2 text-center font-black text-xs text-[var(--foreground-muted)]">{item.quantity}</td>
                      <td className="py-8 px-2 text-right font-bold text-[var(--foreground-muted)] text-sm">
                        {item.unitPrice.toLocaleString()} <span className="text-[9px] opacity-60">DA</span>
                       </td>
                      <td className="py-8 px-2 text-right font-black text-sm italic text-[var(--foreground)]">
                        {(item.quantity * item.unitPrice).toLocaleString()} <span className="text-[9px] text-[var(--accent)]">DA</span>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section Totaux */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-12 pt-12 border-t-2 border-[var(--border)]">
              <div className="max-w-[280px]">
                <p className="text-[10px] font-black uppercase text-[var(--foreground-muted)] tracking-widest mb-4 italic flex items-center gap-2">
                  <FileText size={12} /> Notes & Conditions
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)]/70 leading-relaxed font-medium">
                  Le règlement s'effectue à réception. Toute facture impayée à l'échéance sera majorée de pénalités de retard au taux légal.
                </p>
              </div>
              
              <div className="w-full md:w-80 space-y-4">
                <div className="flex justify-between items-center text-[var(--foreground-muted)] font-bold text-[10px] uppercase tracking-widest">
                  <span>Sous-total HT</span>
                  <span className="text-[var(--foreground)]">{(invoice.subtotal || 0).toLocaleString()} DA</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-[var(--foreground-muted)] font-bold text-[10px] uppercase tracking-widest">
                    <span>TVA (19%)</span>
                    <span className="text-[var(--foreground)]">{invoice.taxAmount?.toLocaleString()} DA</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-8 border-t border-[var(--border)]">
                  <span className="font-black italic uppercase text-[var(--accent)] text-[12px] tracking-[0.2em] mb-2">Net à Payer</span>
                  <span className="text-6xl font-black italic text-[var(--foreground)] tracking-tighter leading-none">
                    {invoice.total?.toLocaleString()} <span className="text-xs not-italic text-[var(--accent)] ml-1">DA</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. COLONNE LATERALE : INFOS & PAIEMENT */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Fiche Client */}
          <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-10 rounded-[3.5rem] border border-[var(--border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <User size={60} />
            </div>
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase mb-10 italic text-[var(--accent)] tracking-widest relative z-10">
              <User size={14} /> Fiche Client
            </h4>
            <div className="space-y-8 relative z-10">
              <div>
                <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)] mb-2 tracking-tighter opacity-70">Nom du client / Entité</p>
                <p className="font-black text-2xl leading-tight italic text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {invoice.clientId?.name}
                </p>
                <div className="flex items-center gap-2 mt-3 p-3 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]">
                  <Mail size={12} className={clientEmail ? "text-[var(--accent)]" : "text-rose-400"} />
                  <p className={`text-[10px] font-bold truncate ${!clientEmail ? 'text-rose-400 italic' : 'text-[var(--foreground-muted)]'}`}>
                    {clientEmail || "Aucun email configuré"}
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-[var(--border)]">
                <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)] mb-3 tracking-widest">Échéance</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs ${invoice.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border)]'}`}>
                  <Calendar size={14} /> {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: fr })}
                </div>
              </div>
            </div>
          </div>

          {/* État Financier & Action */}
          <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-10 rounded-[3.5rem] border border-[var(--border)] group overflow-hidden relative">
            {/* Effet de lueur */}
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[var(--accent)]/10 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/20 transition-all duration-700" />
            
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase mb-12 italic opacity-40 tracking-[0.2em] relative z-10">
              <CreditCard size={14} /> État Financier
            </h4>
            
            <div className="space-y-10 relative z-10">
                <div className="flex justify-between items-center bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)]">
                  <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Montant Perçu</span>
                  <span className="font-black text-emerald-400 italic text-lg">{(invoice.paidAmount || 0).toLocaleString()} <small className="text-[10px] not-italic opacity-60">DA</small></span>
                </div>
                
                <div className="flex justify-between items-end py-8 border-y border-[var(--border)]">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black opacity-40 uppercase tracking-tighter text-[var(--accent)] mb-2">Reste à payer</span>
                    <span className="text-3xl sm:text-4xl sm:text-5xl font-black italic tracking-tighter text-[var(--foreground)]">
                      {remainingBalance.toLocaleString()} <small className="text-xs font-bold opacity-30 not-italic">DA</small>
                    </span>
                  </div>
                </div>
                
                {invoice.status !== 'paid' && remainingBalance > 0 && (
                  <ChargilyPayPanel invoiceId={invoice._id} amountDue={remainingBalance} />
                )}

                {invoice.status !== 'paid' ? (
                 <form action={handleQuickPay} className="w-full">
                   <QuickPayButton />
                 </form>
                ) : (
                  <div className="w-full py-5 bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] flex items-center justify-center gap-3 text-emerald-400 font-black text-[11px] uppercase tracking-widest shadow-inner backdrop-blur-sm">
                    <div className="p-1 bg-emerald-500 rounded-full text-[var(--background)]">
                      <CheckCircle size={14} />
                    </div>
                    Transaction Terminée
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant de Badge de Statut (Interne à la page)
 */
function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const styles: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    draft: "bg-[var(--foreground-muted)]/10 text-[var(--foreground-muted)] border-[var(--foreground-muted)]/30",
    overdue: "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse",
  };
  const labels: Record<string, string> = {
    paid: "Payée", sent: "Envoyée", draft: "Brouillon", overdue: "En Retard",
  };

  return (
    <span className={`px-8 py-3 rounded-full text-[11px] font-black uppercase border italic tracking-[0.25em] transition-all duration-500 ${styles[s] || styles.draft}`}>
      {labels[s] || status}
    </span>
  );
}