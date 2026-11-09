"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteCategoryAction } from "@/app/actions/categoryActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// 1. تحديث التعريف ليشمل التوكن
interface DeleteConfirmProps {
  id: string;
  name: string;
  token?: string; // إضافة التوكن هنا لحل خطأ ts(2322)
}

export default function DeleteConfirm({ id, name, token }: DeleteConfirmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // 2. تمرير المعرف والتوكن للأكشن (تأكد أن الأكشن يستقبلهما)
      const result = await deleteCategoryAction(id, token);
      
      if (result?.success) {
        setIsOpen(false);
        toast.success(`Segment "${name}" supprimé avec succès`);
        router.refresh(); 
      } else {
        toast.error(result?.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-90"
      >
        <Trash2 size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => !isDeleting && setIsOpen(false)} 
          />
          
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-2xl mb-5">
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2 text-zinc-900 dark:text-zinc-100 leading-tight">
                Supprimer <span className="text-rose-600">{name}</span> ?
              </h3>
              
              <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed mb-8 tracking-tighter">
                Cette action est irréversible. Les produits associés perdront leur étiquette de classification.
              </p>

              <div className="flex w-full gap-3">
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsOpen(false)}
                  className="flex-1 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 p-4 rounded-2xl bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}