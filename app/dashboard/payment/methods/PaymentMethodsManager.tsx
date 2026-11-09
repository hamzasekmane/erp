// app/dashboard/payment/methods/PaymentMethodsManager.tsx
"use client";

import { useState } from "react";
import { Wallet, Landmark, CreditCard, Smartphone, Check, X, Loader2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  icon: string;
  description: string;
}

interface PaymentMethodsManagerProps {
  initialMethods: PaymentMethod[];
  token: string;
}

const iconMap: Record<string, any> = {
  wallet: Wallet,
  landmark: Landmark,
  credit_card: CreditCard,
  smartphone: Smartphone,
};

export default function PaymentMethodsManager({ initialMethods, token }: PaymentMethodsManagerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggle = async (method: PaymentMethod) => {
    setLoadingId(method.id);
    setError(null);
    
    // Simulate API call (replace with actual service)
    try {
      // In a real app, you would call paymentService.toggleMethod(method.id, !method.isActive, token)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMethods(prev =>
        prev.map(m => (m.id === method.id ? { ...m, isActive: !m.isActive } : m))
      );
      setSuccess(`Méthode ${method.name} ${!method.isActive ? "activée" : "désactivée"}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Erreur lors de la modification");
    } finally {
      setLoadingId(null);
    }
  };

  const activeCount = methods.filter(m => m.isActive).length;

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">Méthodes actives</p>
          <p className="text-2xl font-black text-[var(--accent)]">{activeCount}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">Méthodes totales</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{methods.length}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">Statut</p>
          <p className="text-sm font-black text-emerald-500">✓ Opérationnel</p>
        </div>
      </div>

      {/* Methods grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => {
          const Icon = iconMap[method.icon] || CreditCard;
          return (
            <div
              key={method.id}
              className={`bg-[var(--card-bg)] border rounded-xl p-5 transition-all ${
                method.isActive
                  ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                  : "border-[var(--border)] opacity-75"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${method.isActive ? "bg-[var(--accent)]/10" : "bg-[var(--border)]"}`}>
                    <Icon size={18} className={method.isActive ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]"} />
                  </div>
                  <div>
                    <h3 className="font-black text-[var(--foreground)]">{method.name}</h3>
                    <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{method.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(method)}
                  disabled={loadingId === method.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    method.isActive ? "bg-emerald-500" : "bg-[var(--border)]"
                  }`}
                >
                  {loadingId === method.id ? (
                    <Loader2 size={12} className="mx-auto animate-spin text-white" />
                  ) : (
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        method.isActive ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-[var(--foreground-muted)]">{method.description}</p>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl text-center">
        <p className="text-[9px] font-mono text-[var(--foreground-muted)]">
          Les méthodes actives apparaîtront dans le formulaire de création de paiement.
        </p>
      </div>
    </div>
  );
}