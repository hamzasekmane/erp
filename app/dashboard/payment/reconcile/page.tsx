// app/dashboard/payment/reconcile/page.tsx
import { cookies } from "next/headers";
import { paymentService } from "@/app/services/paymentServices";
import { ArrowLeft, CheckCircle, Banknote } from "lucide-react";
import Link from "next/link";
import ReconciliationManager from "./ReconciliationManager";

export const metadata = {
  title: "Velora ERP | Rapprochement Bancaire",
  description: "Concilier les paiements avec les factures et relevés bancaires",
};

export default async function ReconciliationPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // Fetch pending payments (not yet reconciled)
  let pendingPayments: any[] = [];
  let reconciledPayments: any[] = [];
  let error = false;

  try {
    // Get all payments with status 'completed' or 'paid'
    const response = await paymentService.getAll(token, { status: "completed,paid", limit: 100 });
    const allPayments = response?.data || [];

    // Split into pending and reconciled (you can add a field like 'reconciled' in your model)
    // For now, we simulate: payments with notes containing "reconciled" are done
    pendingPayments = allPayments.filter((p: any) => !p.notes?.includes("reconciled"));
    reconciledPayments = allPayments.filter((p: any) => p.notes?.includes("reconciled"));
  } catch (err) {
    console.error("Failed to fetch payments for reconciliation:", err);
    error = true;
  }

  // Mock data for development
  if (process.env.NODE_ENV === "development" && (error || pendingPayments.length === 0)) {
    pendingPayments = [
      { _id: "pay_001", paymentNumber: "PAY-001", amount: 12500, method: "VIREMENT", clientId: { name: "ABC SARL" }, invoiceId: { invoiceNumber: "INV-2024-001" }, createdAt: new Date().toISOString() },
      { _id: "pay_002", paymentNumber: "PAY-002", amount: 8750, method: "CARTE BANCAIRE", clientId: { name: "XYZ Corporation" }, invoiceId: { invoiceNumber: "INV-2024-002" }, createdAt: new Date().toISOString() },
      { _id: "pay_003", paymentNumber: "PAY-003", amount: 3400, method: "PAYPAL", clientId: { name: "Client Direct" }, invoiceId: { invoiceNumber: "INV-2024-003" }, createdAt: new Date().toISOString() },
    ];
    reconciledPayments = [
      { _id: "pay_004", paymentNumber: "PAY-004", amount: 22000, method: "VIREMENT", clientId: { name: "Fournisseur X" }, invoiceId: { invoiceNumber: "INV-2024-004" }, notes: "reconciled on 2024-02-15" },
    ];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payment"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <CheckCircle size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • PAYMENT
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● RECONCILIATION
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapprochement <span className="text-[var(--accent)]">Bancaire</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Conciliez les paiements reçus avec les factures et relevés
              </p>
            </div>
          </div>
        </div>

        {/* Client Component */}
        <ReconciliationManager 
          pendingPayments={pendingPayments}
          reconciledPayments={reconciledPayments}
          token={token}
        />

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Payment Reconciliation • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Mise à jour temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}