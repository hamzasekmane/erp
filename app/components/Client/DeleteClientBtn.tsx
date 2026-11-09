"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteClientAction } from "@/app/actions/clientActions";
import { useRouter } from "next/navigation";

export default function DeleteClientBtn({ id, name }: { id: string, name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteClientAction(id);
    if (result.success) {
      // In Next.js, use router.refresh() to update the list without leaving the page
      router.refresh(); 
      setIsOpen(false);
      setIsDeleting(false);
    } else {
      alert(result.error);
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
        title="Supprimer le client"
      >
        <Trash2 size={20} />
      </button>

      {/* Modal - French Translation & LTR Styling */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">Êtes-vous sûr ?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Vous êtes sur le point de supprimer le client <span className="font-bold text-zinc-800 dark:text-zinc-200">{name}</span>. 
                Cette action est irréversible.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-rose-100 dark:shadow-none flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : "Oui, supprimer"}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold py-4 rounded-2xl transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}