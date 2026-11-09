"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPaymentAction, updatePaymentAction } from "@/app/actions/paymentActions";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, CreditCard, Banknote, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function PaymentForm({ initialData, invoiceId, isEditing = false, token }: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const actionWithId = isEditing ? updatePaymentAction.bind(null, initialData?._id) : createPaymentAction;
  const [state, formAction, isPending] = useActionState(actionWithId, null);

  useEffect(() => {
    if (state?.success) {
      if (!isEditing) formRef.current?.reset();
      setTimeout(() => { router.push("/dashboard/payment"); router.refresh(); }, 1500);
    }
  }, [state, isEditing, router]);

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl text-white ${isEditing ? 'bg-amber-500' : 'bg-blue-600'}`}>
          {isEditing ? <Save size={20} /> : <Plus size={20} />}
        </div>
        <div>
          <h2 className="text-xl font-black uppercase italic text-zinc-900 dark:text-white">
            {isEditing ? "Modifier" : "Nouveau"} Paiement <span className={isEditing ? 'text-amber-500' : 'text-blue-600'}>.</span>
          </h2>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Configuration financière</p>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="space-y-5">
        <input type="hidden" name="token" value={token} />
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase ml-2 text-zinc-500 flex items-center gap-1.5"><FileText size={12}/> ID Facture</label>
          <input name="invoiceId" defaultValue={initialData?.invoiceId || invoiceId || ""} readOnly={!!invoiceId} required className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent font-bold outline-none focus:border-blue-500/50 text-zinc-900 dark:text-zinc-100 transition-all" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase ml-2 text-zinc-500 flex items-center gap-1.5"><Banknote size={12}/> Montant</label>
            <input name="amount" type="number" step="0.01" defaultValue={initialData?.amount || ""} required className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent font-bold outline-none focus:border-blue-500/50 text-zinc-900 dark:text-zinc-100 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase ml-2 text-zinc-500 flex items-center gap-1.5"><CreditCard size={12}/> Mode</label>
            <select name="method" defaultValue={initialData?.method || "cash"} className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent font-bold outline-none focus:border-blue-500/50 text-zinc-900 dark:text-zinc-100 appearance-none">
              <option value="cash">Espèces</option>
              <option value="bank_transfer">Virement</option>
              <option value="credit_card">Carte</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase ml-2 text-zinc-500">Référence / Note</label>
          <textarea name="notes" defaultValue={initialData?.notes || ""} rows={2} className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent font-bold outline-none focus:border-blue-500/50 text-zinc-900 dark:text-zinc-100 resize-none" />
        </div>

        <button disabled={isPending} type="submit" className={`w-full p-5 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${isEditing ? 'bg-amber-500' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'}`}>
          {isPending ? <Loader2 className="animate-spin" size={18}/> : isEditing ? <Save size={18}/> : <Plus size={18}/>}
          {isPending ? "Synchronisation..." : isEditing ? "Appliquer" : "Confirmer le paiement"}
        </button>

        {state?.message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-bounce-in ${state.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
            {state.success ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            <p className="text-[10px] font-black uppercase">{state.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}