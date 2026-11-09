// app/dashboard/payment/[id]/page.tsx
import { paymentService } from "@/app/services/paymentServices";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt, User, Calendar, Landmark, ShieldCheck } from "lucide-react";
import Link from "next/link";
import DeletePaymentButton from "@/app/components/payments/DeletePaymentButton";
import PrintButton from "@/app/components/payments/PrintButton";

export default async function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  let payment;
  try {
    const response = await paymentService.getPaymentById(id, token);
    payment = response?.data || response;

    if (!payment || (!payment._id && !payment.id)) {
      return notFound();
    }
  } catch (error) {
    console.error("Error fetching payment:", error);
    return notFound();
  }

  const paymentId = payment.paymentNumber || (payment._id || id).slice(-6).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <Link 
            href="/dashboard/payment" 
            className="group flex items-center gap-2 text-[10px] font-black uppercase text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            Retour à la liste
          </Link>
          
          <DeletePaymentButton id={id} token={token} />
        </div>

        {/* Main Receipt Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          
          {/* Top Branding Section */}
          <div className="bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.2em]">
                  Confirmation de Transaction
                </p>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
                <span className="text-[var(--foreground)]">#</span>
                <span className="text-[var(--accent)]">{paymentId}</span>
              </h1>
            </div>
            <div className="text-right">
              <p className="text-3xl md:text-4xl font-black text-[var(--accent)] tracking-tighter">
                {payment.amount?.toLocaleString('fr-FR')}
                <span className="text-sm ml-1 text-[var(--foreground-muted)] font-mono">DZD</span>
              </p>
            </div>
          </div>
          
          {/* Information Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <DetailItem 
              icon={<User size={16} className="text-[var(--accent)]" />} 
              label="Client / Payeur" 
              value={payment.clientId?.name || payment.clientName || "Client Général"} 
            />
            <DetailItem 
              icon={<Receipt size={16} className="text-amber-500" />} 
              label="Référence Facture" 
              value={payment.invoiceId?.invoiceNumber || "Facture Directe"} 
            />
            <DetailItem 
              icon={<Calendar size={16} className="text-emerald-500" />} 
              label="Date d'exécution" 
              value={payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'long', day: 'numeric'
              }) : "Date non spécifiée"} 
            />
            <DetailItem 
              icon={<Landmark size={16} className="text-purple-500" />} 
              label="Mode de Règlement" 
              value={payment.method} 
              status={payment.status}
            />

            {payment.notes && (
              <div className="col-span-full p-6 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)] mb-2 tracking-wider">
                  Note interne
                </p>
                <p className="text-sm text-[var(--foreground)] italic">
                  "{payment.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 bg-[var(--background)]/50 border-t border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-tighter">
                Vérifié par le système de comptabilité
              </span>
            </div>
            
            <PrintButton />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Payment Details • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Transaction sécurisée
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, status }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
        {icon} 
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        <p className="text-base md:text-lg font-black text-[var(--foreground)] leading-tight">
          {value}
        </p>
        {status && (
          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
            status === 'paid' || status === 'completed' 
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}