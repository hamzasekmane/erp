"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteProductAction } from "@/app/actions/productsAction";
import { useRouter } from "next/navigation";

interface DeleteProductBtnProps {
  productId: string;
  productName: string;
  token: string;
}

export default function DeleteProductBtn({ productId, productName }: DeleteProductBtnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProductAction(productId);
      
      if (result.success) {
        // router.refresh() force Next.js à re-fetch les données du serveur (re-exécuter ProductsPage)
        router.refresh(); 
        setIsOpen(false);
      } else {
        alert(result.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur de connexion au serveur");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
        title="Supprimer le produit"
      >
        <Trash2 size={18} />
      </button>

      {/* --- MODAL DE CONFIRMATION --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">Supprimer ?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed">
                Vous allez supprimer <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{productName}</span>. 
                Toutes les données de stock associées seront perdues.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "Confirmer la suppression"}
              </button>
              
              <button
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all active:scale-95"
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