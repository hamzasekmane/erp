"use client";

import React, { useActionState, useRef, useEffect, useMemo, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/productsAction";
import { 
  Plus, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown,
  Sparkles,
  Calculator,
  Zap
} from "lucide-react";

// --- Types & Constants ---
interface ProductFormProps {
  categories: any[];
  initialData?: any;
  isEditing?: boolean;
  token: string;
  taxes?: any[];
}

interface FormState {
  success: boolean;
  message: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "🟢 Actif / En Vente", color: "text-emerald-500" },
  { value: "inactive", label: "🔴 Inactif / Brouillon", color: "text-rose-500" },
] as const;

const UNIT_OPTIONS = [
  { value: "piece", label: "Pièce (PCS)" },
  { value: "kg", label: "Kilogramme (KG)" },
  { value: "meter", label: "Mètre (M)" },
  { value: "liter", label: "Litre (L)" },
  { value: "box", label: "Boîte (BOX)" },
] as const;

// --- Helper for Shared Styles ---
const INPUT_STYLE = "w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-transparent focus:border-emerald-500/20 rounded-[1.8rem] px-7 py-5 text-sm font-bold transition-all outline-none text-zinc-900 dark:text-zinc-100 shadow-inner focus:ring-4 focus:ring-emerald-500/5";
const LABEL_STYLE = "text-[10px] font-black uppercase text-zinc-400 ml-4 italic tracking-[0.2em] block mb-2";

export default function ProductForm({ 
  categories, 
  initialData, 
  isEditing = false,
  token,
  taxes = []
}: ProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  // Local states for real-time calculations
  const [price, setPrice] = useState(initialData?.price || 0);
  const [selectedTaxId, setSelectedTaxId] = useState(initialData?.taxId?._id || initialData?.taxId || "");

  // Memoized action
  const actionWithId = useMemo(() => 
    isEditing && initialData?._id 
      ? updateProductAction.bind(null, initialData._id) 
      : createProductAction,
    [isEditing, initialData?._id]
  );

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    actionWithId,
    { success: false, message: "" }
  );

  // Auto-calculation logic
  const totalPriceTTC = useMemo(() => {
    const selectedTax = taxes.find(t => t._id === selectedTaxId);
    const rate = selectedTax ? selectedTax.rate : 0;
    return price * (1 + rate / 100);
  }, [price, selectedTaxId, taxes]);

  // Reset form on success
  useEffect(() => {
    if (state.success && !isEditing && formRef.current) {
      formRef.current.reset();
      setPrice(0);
      setSelectedTaxId("");
    }
  }, [state.success, isEditing]);

  return (
    <div className="space-y-6">
      {/* --- Feedback Toast --- */}
      {state.message && (
        <div className={`p-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 animate-in fade-in zoom-in duration-300 border shadow-lg ${
          state.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
        }`}>
          {state.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{state.message}</span>
          {state.success && <Sparkles size={16} className="ml-auto" />}
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-6">
        <input type="hidden" name="token" value={token} />
        {isEditing && <input type="hidden" name="id" value={initialData?._id} />}

        {/* 1. Name Section */}
        <div className="space-y-2">
          <label className={LABEL_STYLE}>Désignation</label>
          <input name="name" defaultValue={initialData?.name} required className={INPUT_STYLE} placeholder="Nom du produit..." />
        </div>

        {/* 2. Grid for SKU and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_STYLE}>Code SKU</label>
            <input name="code" defaultValue={initialData?.code} required className={`${INPUT_STYLE} font-mono`} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_STYLE}>Catégorie</label>
            <div className="relative">
              <select name="categoryId" className={`${INPUT_STYLE} appearance-none pr-12`} defaultValue={initialData?.categoryId?._id}>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            </div>
          </div>
        </div>

        {/* 3. Pricing & Tax with Live Preview */}
        <div className="bg-zinc-900/5 dark:bg-zinc-50/5 p-6 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={LABEL_STYLE}>Prix HT (DA)</label>
              <input 
                name="price" 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))}
                className={`${INPUT_STYLE} text-emerald-500`} 
              />
            </div>
            <div className="space-y-2">
              <label className={LABEL_STYLE}>Taxe Appliquée</label>
              <div className="relative">
                <select 
                  name="taxId" 
                  value={selectedTaxId} 
                  onChange={(e) => setSelectedTaxId(e.target.value)}
                  className={`${INPUT_STYLE} appearance-none pr-12`}
                >
                  <option value="">Sans taxe (0%)</option>
                  {taxes.map(tax => <option key={tax._id} value={tax._id}>{tax.name} ({tax.rate}%)</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              </div>
            </div>
          </div>

          {/* Automatic Calculation Preview */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
             <div className="flex items-center gap-3">
               <Calculator size={16} className="text-zinc-400" />
               <span className="text-[10px] font-black uppercase text-zinc-500">Prix Total TTC</span>
             </div>
             <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
               {totalPriceTTC.toLocaleString('fr-FR')} <span className="text-[10px] text-zinc-400">DZD</span>
             </span>
          </div>
        </div>

        {/* 4. Stock Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_STYLE}>Stock Actuel</label>
            <input name="stock" type="number" defaultValue={initialData?.stock || 0} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_STYLE}>Alerte Min</label>
            <input name="minStock" type="number" defaultValue={initialData?.minStock || 5} className={`${INPUT_STYLE} text-rose-500`} />
          </div>
        </div>

        {/* 5. Submit Action */}
        <button
          type="submit"
          disabled={isPending}
          className={`
            group relative w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[13px]
            flex items-center justify-center gap-3 transition-all duration-300
            active:scale-95 disabled:opacity-50
            ${isEditing ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-[#10b981] text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:bg-[#059669] hover:-translate-y-1'}
          `}
        >
          {isPending ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              {isEditing ? <Save size={20} /> : <Zap size={20} className="fill-current" />}
              {isEditing ? "Mettre à jour" : "Enregistrer le Produit"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}