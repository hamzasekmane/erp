// C:\Users\hamza\Desktop\a\frontend\app\components\invoices\PaymentModal.tsx
"use client";

import { useActionState, useEffect, useState } from "react"; 
import { X, DollarSign, CheckCircle2, Loader2, Wallet, MoreHorizontal } from "lucide-react";
import { processPaymentAction } from "@/app/actions/invoiceActions";
import { toast } from "sonner";

interface PaymentModalProps {
  invoice: any;
  onClose: () => void;
  // ❌ تم إزالة token - الـ action يجلبه تلقائياً من الكوكيز
}

// --- HEALER UTILITY ---
const parseNumericValue = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val)
    .replace(/\s|&nbsp;|\u00A0/g, '') // Strips all types of spaces
    .replace(',', '.');               // Fixes French commas
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export default function PaymentModal({ invoice, onClose }: PaymentModalProps) {
  const [amountInput, setAmountInput] = useState<string>("");
  
  // 1. Sanitize inputs to avoid NaN errors in calculations
  const total = parseNumericValue(invoice.total ?? invoice.amount);
  const paid = parseNumericValue(invoice.paidAmount ?? invoice.balance_paid ?? invoice.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) ?? 0);
  const remainingAmount = Number((total - paid).toFixed(2));

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // تحديث القيمة المعروضة للرصيد الجديد
  const getCurrentAmount = (): number => {
    const input = document.getElementsByName('amount')[0] as HTMLInputElement;
    return input ? Number(input.value) || 0 : 0;
  };

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const amount = Number(formData.get("amount"));

      // Validation logic
      if (amount <= 0) return { success: false, message: "Le montant doit être supérieur à 0" };
      if (amount > remainingAmount + 0.01) { // 0.01 buffer for float rounding
        return { success: false, message: "Le montant dépasse le solde dû" };
      }

      const paymentData = {
        amount,
        method: String(formData.get("paymentMethod") || "CASH"),
        notes: (formData.get("notes") as string) || undefined,
      };
      
      // ✅ لا ترسل token - الـ action يجلبه تلقائياً
      const result = await processPaymentAction(null, { 
        id: invoice._id, 
        paymentData
        // ❌ تم إزالة token
      });
      
      if (result.success) {
        toast.success(`Règlement de ${amount.toLocaleString('fr-FR')} DA enregistré !`);
        onClose();
        // تحديث الصفحة لعرض البيانات الجديدة
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
      return result;
    },
    null
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Wallet className="text-emerald-600 dark:text-emerald-400" size={18} />
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Règlement
              </h2>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                {invoice.invoiceNumber || "SANS RÉF"}
              </span>
              <span>•</span>
              <span>Reste: <span className="text-zinc-900 dark:text-white font-black text-sm">{remainingAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all hover:rotate-90 duration-300 group"
            aria-label="Fermer"
          >
            <X size={20} className="group-hover:text-rose-500 transition-colors" />
          </button>
        </div>

        {/* Formulaire */}
        <form action={formAction} className="p-8 space-y-6">
          
          {/* Error Message */}
          {state?.success === false && (
            <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl animate-in shake-in duration-300">
              <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase italic text-center leading-none">
                {state.message}
              </p>
            </div>
          )}

          {/* Montant Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest flex items-center gap-2">
                <DollarSign size={12} className="text-emerald-500" />
                Montant à encaisser (DA)
              </label>
              <button 
                type="button"
                onClick={() => {
                  const input = document.getElementsByName('amount')[0] as HTMLInputElement;
                  if (input) {
                    input.value = remainingAmount.toString();
                    setAmountInput(remainingAmount.toString());
                    input.focus();
                  }
                }}
                className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter hover:underline underline-offset-2 transition-all px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full"
              >
                Solde total
              </button>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl group-focus-within:scale-110 transition-transform">
                <DollarSign className="text-emerald-600 dark:text-emerald-400" size={18} />
              </div>
              <input 
                name="amount"
                type="number" 
                step="0.01"
                required
                max={remainingAmount}
                defaultValue={remainingAmount}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full pl-16 pr-6 py-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent font-black text-2xl text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:ring-4 ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                placeholder="0.00"
              />
            </div>
            {remainingAmount > 0 && (
              <p className="text-[9px] text-zinc-400 px-2 italic">
                Montant maximum: {remainingAmount.toLocaleString('fr-FR')} DA
              </p>
            )}
          </div>

          {/* Date et Mode de paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 italic flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                Date du flux
              </label>
              <div className="relative">
                <input 
                  name="paymentDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent font-bold text-xs outline-none focus:border-emerald-500 focus:ring-4 ring-emerald-500/20 transition-all dark:text-zinc-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 italic flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                Mode de paiement
              </label>
              <div className="relative">
                <select 
                  name="paymentMethod"
                  defaultValue="cash"
                  className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent font-bold text-xs outline-none appearance-none cursor-pointer focus:border-emerald-500 focus:ring-4 ring-emerald-500/20 transition-all dark:text-zinc-200"
                >
                  <option value="cash">💵 Espèces</option>
                  <option value="transfer">🏦 Virement Bancaire</option>
                  <option value="cheque">📝 Chèque</option>
                  <option value="card">💳 Carte Bancaire</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <MoreHorizontal size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 italic flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-500 rounded-full" />
              Référence ou Notes
            </label>
            <input 
              name="notes"
              autoComplete="off"
              placeholder="Ex: N° Chèque, Référence virement, observations..."
              className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent font-medium text-xs outline-none focus:border-emerald-500 focus:ring-4 ring-emerald-500/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Récapitulatif */}
          <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-center px-2 py-3 bg-zinc-100/50 dark:bg-zinc-800/30 rounded-xl">
              <span className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                Nouveau solde après paiement
              </span>
              <span className="text-sm font-black text-zinc-900 dark:text-white">
                {Math.max(0, remainingAmount - getCurrentAmount()).toLocaleString('fr-FR')} DA
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-6 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 group"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Traitement en cours...
              </>
            ) : (
              <>
                Valider le règlement
                <CheckCircle2 size={18} className="group-hover:rotate-12 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[8px] text-zinc-400 uppercase tracking-wider">
            Cette opération est irréversible • Tous les montants sont en Dinar Algérien
          </p>
        </div>
      </div>
    </div>
  );
}