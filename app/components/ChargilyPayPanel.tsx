"use client";

import { useActionState, useState } from "react";
import { CreditCard, Loader2, Smartphone, Landmark, ShieldCheck, AlertCircle } from "lucide-react";
import { createChargilyCheckoutAction, type CheckoutState } from "@/app/actions/chargilyActions";

type Props = {
  invoiceId: string;
  amountDue: number;
  disabled?: boolean;
};

const INITIAL: CheckoutState = {};

export default function ChargilyPayPanel({ invoiceId, amountDue, disabled }: Props) {
  const [method, setMethod] = useState<"edahabia" | "cib">("edahabia");
  const [state, formAction, pending] = useActionState(createChargilyCheckoutAction, INITIAL);

  const methods = [
    { id: "edahabia" as const, label: "EDAHABIA", hint: "Algérie Poste", icon: Smartphone },
    { id: "cib" as const, label: "CIB", hint: "Carte interbancaire", icon: Landmark },
  ];

  return (
    <div className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard size={14} className="text-[var(--accent)]" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
          Paiement en ligne
        </p>
        <span className="ms-auto text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
          Chargily Pay
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              aria-pressed={active}
              disabled={pending || disabled}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-start transition-all disabled:opacity-60 ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--accent)]/40"
              }`}
            >
              <Icon size={16} />
              <span className="leading-tight">
                <span className="block text-[11px] font-black tracking-wide">{m.label}</span>
                <span className="block text-[9px] opacity-70">{m.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <input type="hidden" name="method" value={method} />
        <button
          type="submit"
          disabled={pending || disabled}
          className="w-full py-4 rounded-2xl bg-[var(--accent)] text-[var(--background)] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
          {pending ? "Redirection vers Chargily..." : `Payer ${amountDue.toLocaleString()} DA en ligne`}
        </button>
      </form>

      {state?.error && (
        <p className="flex items-start gap-2 text-[10px] font-bold text-rose-500">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}

      <p className="text-[9px] leading-relaxed text-[var(--foreground-muted)]/70">
        Vous serez redirigé vers la page sécurisée Chargily. La facture est soldée uniquement après confirmation
        signée du paiement par la passerelle.
      </p>
    </div>
  );
}
