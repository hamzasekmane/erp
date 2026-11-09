"use client";

import React, { useState, useTransition } from "react";
import { Trash2, Edit3, Percent, Loader2, AlertCircle } from "lucide-react";
import { deleteTaxAction } from "@/app/actions/taxActions";
import TaxFormModal from "./TaxFormModal";

interface TaxCardProps {
  tax: {
    _id: string;
    name: string;
    rate: number;
  };
  token: string;
}

export default function TaxCard({ tax, token }: TaxCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = () => {
    if (confirm(`Voulez-vous vraiment supprimer la taxe "${tax.name}" ?`)) {
      startTransition(async () => {
        const result = await deleteTaxAction(tax._id, token);
        if (!result.success) {
          alert(result.message);
        }
      });
    }
  };

  return (
    <div className={`group relative bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      
      {/* --- Action Buttons (Visible on Hover) --- */}
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <button 
          onClick={() => setShowEditModal(true)}
          className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-2xl transition-colors"
          title="Modifier"
        >
          <Edit3 size={16} />
        </button>
        <button 
          onClick={handleDelete}
          className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded-2xl transition-colors"
          title="Supprimer"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>

      {/* --- Card Content --- */}
      <div className="relative space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
          <Percent size={20} />
        </div>
        
        <div>
          <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">
            {tax.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <AlertCircle size={10} />
            <span>TVA Applicable</span>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-baseline gap-1">
          <span className="text-4xl font-black text-emerald-600">
            {tax.rate}
          </span>
          <span className="text-lg font-bold text-emerald-600/50">%</span>
        </div>
      </div>

      {/* --- Edit Modal Logic --- */}
      {showEditModal && (
        <TaxFormModal 
          token={token} 
          initialData={tax} 
          isEditing={true} 
          onClose={() => setShowEditModal(false)} 
        />
      )}
    </div>
  );
}