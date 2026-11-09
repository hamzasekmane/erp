"use client";

import React, { useActionState, useEffect, useMemo } from "react";
import { createTaxAction, updateTaxAction } from "@/app/actions/taxActions";
import { X, Loader2, Save, Plus, Percent } from "lucide-react";

interface TaxFormModalProps {
  token: string;
  initialData?: any; // If provided, we are in Edit Mode
  isEditing?: boolean;
  onClose?: () => void; // Used to close the modal externally
}

export default function TaxFormModal({ 
  token, 
  initialData, 
  isEditing = false,
  onClose 
}: TaxFormModalProps) {
  const [isOpen, setIsOpen] = React.useState(isEditing);

  // 1. Logic: Bind the update action with the ID if editing
  const actionWithId = useMemo(() => 
    isEditing && initialData?._id 
      ? updateTaxAction.bind(null, initialData._id) 
      : createTaxAction,
    [isEditing, initialData?._id]
  );

  const [state, formAction, isPending] = useActionState(actionWithId, null);

  // 2. Auto-close modal on successful server response
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        if (onClose) onClose();
      }, 800); // Small delay to let the user see the success
      return () => clearTimeout(timer);
    }
  }, [state?.success, onClose]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onClose && isOpen) onClose();
  };

  return (
    <>
      {/* Trigger Button (Only show if not already forced open by Edit Mode) */}
      {!isEditing && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Ajouter une taxe
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative border border-zinc-100 dark:border-zinc-800">
            
            {/* Close Button */}
            <button 
              onClick={handleToggle} 
              className="absolute right-8 top-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={24}/>
            </button>
            
            <div className="mb-8 space-y-2">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {isEditing ? "Modifier la Taxe" : "Nouvelle Taxe"}
              </h2>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest italic">Configuration TVA</p>
            </div>

            <form action={formAction} className="space-y-6">
              {/* Hidden Token for Server Action */}
              <input type="hidden" name="token" value={token} />
              
              {/* Name Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-4 tracking-[0.2em] block">
                  Désignation
                </label>
                <input 
                  name="name" 
                  defaultValue={initialData?.name || ""}
                  placeholder="ex: TVA Normale"
                  required 
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-emerald-500/20 rounded-2xl px-6 py-4 outline-none transition-all font-bold" 
                />
              </div>

              {/* Rate Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-4 tracking-[0.2em] block">
                  Taux (%)
                </label>
                <div className="relative">
                  <input 
                    name="rate" 
                    type="number" 
                    step="0.01" 
                    defaultValue={initialData?.rate || ""}
                    placeholder="19"
                    required 
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-emerald-500/20 rounded-2xl px-6 py-4 outline-none transition-all font-black text-emerald-600" 
                  />
                  <Percent size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>

              {/* Status/Feedback Message */}
              {state?.message && (
                <p className={`text-[11px] font-bold text-center uppercase tracking-wider ${state.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {state.message}
                </p>
              )}

              {/* Submit Button */}
              <button 
                disabled={isPending} 
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                  isEditing 
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" 
                    : "bg-emerald-600 text-white shadow-emerald-500/20"
                }`}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {isEditing ? <Save size={18} /> : <Plus size={18} />}
                    <span>{isEditing ? "Enregistrer" : "Confirmer"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}