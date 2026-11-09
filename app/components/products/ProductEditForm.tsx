"use client";

import React, { useActionState, useRef, useEffect } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/productsAction";
import { Plus, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProductFormProps {
  categories: any[];
  initialData?: any;
  isEditing?: boolean;
  token?: string;     // optional to match page expectations (not used here)
  taxes?: any[];      // optional to match page expectations
}

export default function ProductForm({ categories, initialData, isEditing = false }: ProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const actionWithId = isEditing && initialData?._id
    ? updateProductAction.bind(null, initialData._id)
    : createProductAction;

  const [state, formAction, isPending] = useActionState(actionWithId, {
    success: false,
    message: "",
  });

  useEffect(() => {
    if (state.success && !isEditing && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success, isEditing]);

  return (
    <div className="space-y-6">
      {state.message && (
        <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          state.success 
            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
        }`}>
          {state.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {state.message}
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-5">
        {/* Product Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-[var(--foreground-muted)] ml-2 italic tracking-wider">
            Nom du produit
          </label>
          <input
            name="name"
            defaultValue={initialData?.name || ""}
            placeholder="ex: Désignation de l'article"
            required
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
          />
        </div>

        {/* Code & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--foreground-muted)] ml-2 italic tracking-wider">
              Référence
            </label>
            <input
              name="code"
              defaultValue={initialData?.code || ""}
              placeholder="SKU-XXXX"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--foreground-muted)] ml-2 italic tracking-wider">
              Catégorie
            </label>
            <select
              name="categoryId"
              defaultValue={initialData?.categoryId?._id || initialData?.categoryId || ""}
              required
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">Choisir...</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--foreground-muted)] ml-2 italic tracking-wider">
              Prix (DA)
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialData?.price || ""}
              required
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm font-black text-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--foreground-muted)] ml-2 italic tracking-wider">
              Stock Initial
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={initialData?.stock || ""}
              required
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Min Stock & Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--foreground-muted)] ml-2 italic tracking-wider">
              Alerte Stock
            </label>
            <input
              name="minStock"
              type="number"
              min="0"
              defaultValue={initialData?.minStock || 0}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--foreground-muted)] ml-2 italic tracking-wider">
              Unité
            </label>
            <select
              name="unit"
              defaultValue={initialData?.unit || "pièce"}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="pièce">Pièce (U)</option>
              <option value="kg">Kilogramme (Kg)</option>
              <option value="litre">Litre (L)</option>
              <option value="mètre">Mètre (M)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Button */}
        <button
          type="submit"
          disabled={isPending}
          className={`w-full py-3 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${
            isEditing 
              ? "bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]/10" 
              : "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 shadow-lg"
          }`}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : isEditing ? (
            <>
              <Save size={18} /> Mettre à jour
            </>
          ) : (
            <>
              <Plus size={18} /> Créer le produit
            </>
          )}
        </button>
      </form>
    </div>
  );
}