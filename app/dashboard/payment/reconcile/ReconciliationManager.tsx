// app/dashboard/payment/reconcile/ReconciliationManager.tsx
"use client";

import { useState } from "react";
import { Check, X, Search, Filter, Calendar, Banknote, FileText, Loader2 } from "lucide-react";

interface Payment {
  _id: string;
  paymentNumber: string;
  amount: number;
  method: string;
  clientId: { name: string };
  invoiceId: { invoiceNumber: string };
  createdAt: string;
  notes?: string;
}

interface ReconciliationManagerProps {
  pendingPayments: Payment[];
  reconciledPayments: Payment[];
  token: string;
}

export default function ReconciliationManager({ 
  pendingPayments, 
  reconciledPayments, 
  token 
}: ReconciliationManagerProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [reconciling, setReconciling] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter pending payments
  const filteredPayments = pendingPayments.filter(p => {
    const matchesSearch = 
      p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceId.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === "all" || p.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const handleReconcile = async (payment: Payment) => {
    setReconciling(true);
    setErrorMsg(null);
    // Simulate API call (replace with actual service)
    try {
      // In real app: await paymentService.reconcilePayment(payment._id, token);
      await new Promise(resolve => setTimeout(resolve, 800));
      setSuccessMsg(`Paiement ${payment.paymentNumber} rapproché avec succès`);
      setTimeout(() => setSuccessMsg(null), 3000);
      // Remove from pending list (would be handled by refetch in real app)
      // For demo, we'll just show success
    } catch (err) {
      setErrorMsg("Erreur lors du rapprochement");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setReconciling(false);
      setSelectedPayment(null);
    }
  };

  // Get unique methods for filter
  const methods = ["all", ...new Set(pendingPayments.map(p => p.method))];

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">En attente</p>
          <p className="text-2xl font-black text-amber-500">{pendingPayments.length}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">Rapprochés</p>
          <p className="text-2xl font-black text-emerald-500">{reconciledPayments.length}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">Montant total en attente</p>
          <p className="text-2xl font-black text-[var(--foreground)]">
            {pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('fr-FR')} DZD
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <Check size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <X size={16} /> {errorMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Rechercher par n° paiement, client, facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--foreground-muted)]" />
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none"
          >
            {methods.map(m => (
              <option key={m} value={m}>{m === "all" ? "Tous les modes" : m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pending payments table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)]">N° Paiement</th>
                <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)]">Client</th>
                <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)]">Facture</th>
                <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)]">Montant</th>
                <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)]">Méthode</th>
                <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)]">Date</th>
                <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="group hover:bg-[var(--accent)]/5 transition-all">
                    <td className="p-4 font-mono text-xs font-black text-[var(--foreground)]">
                      {payment.paymentNumber}
                    </td>
                    <td className="p-4 text-sm text-[var(--foreground)]">
                      {payment.clientId.name}
                    </td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">
                      {payment.invoiceId.invoiceNumber}
                    </td>
                    <td className="p-4 font-black text-[var(--foreground)]">
                      {payment.amount.toLocaleString('fr-FR')} DZD
                    </td>
                    <td className="p-4">
                      <span className="text-[9px] font-black uppercase bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded-full">
                        {payment.method}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-[var(--foreground-muted)]">
                      {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-[10px] font-black uppercase hover:bg-[var(--accent)]/90 transition-all"
                      >
                        <Check size={12} /> Rapprocher
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Banknote size={40} strokeWidth={1} />
                      <p className="text-sm font-black uppercase">Aucun paiement en attente</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently reconciled section */}
      {reconciledPayments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-[var(--foreground-muted)] mb-3">
            Derniers rapprochements
          </h3>
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[var(--border)] bg-[var(--background)]/50">
                  <tr>
                    <th className="p-3 text-[8px] font-black uppercase text-[var(--foreground-muted)]">N°</th>
                    <th className="p-3 text-[8px] font-black uppercase text-[var(--foreground-muted)]">Client</th>
                    <th className="p-3 text-[8px] font-black uppercase text-[var(--foreground-muted)]">Montant</th>
                    <th className="p-3 text-[8px] font-black uppercase text-[var(--foreground-muted)]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {reconciledPayments.slice(0, 5).map(p => (
                    <tr key={p._id}>
                      <td className="p-3 text-xs font-mono">{p.paymentNumber}</td>
                      <td className="p-3 text-sm">{p.clientId.name}</td>
                      <td className="p-3 font-black">{p.amount.toLocaleString()} DZD</td>
                      <td className="p-3 text-xs text-[var(--foreground-muted)]">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for confirmation */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-black">Confirmer le rapprochement</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Voulez-vous marquer le paiement <strong>{selectedPayment.paymentNumber}</strong> comme rapproché ?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-black"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReconcile(selectedPayment)}
                disabled={reconciling}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-black flex items-center gap-2 disabled:opacity-50"
              >
                {reconciling ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}