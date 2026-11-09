"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategoryAction, updateCategoryAction } from "@/app/actions/categoryActions";
import { Loader2, Save, Plus, Palette, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryFormProps {
  initialData?: any;
  isEditing?: boolean;
  token?: string; 
}

export default function CategoryForm({ 
  initialData, 
  isEditing = false, 
  token 
}: CategoryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  
  // استخدام bind لتمرير المعرف (id) كأول وسيط للأكشن في حالة التعديل
  const formActionWithId = isEditing 
    ? updateCategoryAction.bind(null, initialData?._id) 
    : createCategoryAction;

  const [state, formAction, isPending] = useActionState(formActionWithId, null);

  useEffect(() => {
    if (state?.success) {
      if (!isEditing) {
        formRef.current?.reset();
      }
      
      const timer = setTimeout(() => {
        router.push("/dashboard/categories");
        router.refresh();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [state, isEditing, router]);

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl text-white shadow-lg ${isEditing ? 'bg-amber-500 shadow-amber-500/20' : 'bg-cyan-600 shadow-cyan-500/20'}`}>
          {isEditing ? <Save size={20} /> : <Plus size={20} />}
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight italic leading-none text-zinc-900 dark:text-white">
            {isEditing ? "Modifier" : "Nouvelle"} Catégorie <span className={isEditing ? 'text-amber-500' : 'text-cyan-600'}>.</span>
          </h2>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Configuration du segment</p>
        </div>
      </div>
      
      <form ref={formRef} action={formAction} className="space-y-5">
        {/* تمرير التوكن في حقل مخفي لضمان وصوله للأكشن عبر FormData */}
        <input type="hidden" name="token" value={token} />

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase ml-2 text-zinc-500 flex items-center gap-1.5">
            Nom de la famille
          </label>
          <input 
            name="name" 
            defaultValue={initialData?.name || ""}
            placeholder="Ex: NIKE AIR, Électronique..." 
            required 
            className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent font-bold outline-none focus:border-cyan-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-300 text-zinc-900 dark:text-zinc-100" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase ml-2 text-zinc-500">Description / Note</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description || ""}
            placeholder="Précisez l'utilité de cette catégorie..." 
            rows={2}
            className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent font-bold outline-none focus:border-cyan-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all resize-none placeholder:text-zinc-300 text-zinc-900 dark:text-zinc-100" 
          />
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 space-y-3">
          <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
            <Palette size={14} className="text-cyan-600" /> Couleur visuelle
          </label>
          <div className="flex gap-4 items-center">
            <input 
              name="color" 
              type="color" 
              defaultValue={initialData?.color || "#0891b2"}
              className="w-16 h-12 rounded-xl bg-white dark:bg-zinc-700 border-none cursor-pointer p-1 shadow-sm transition-transform hover:scale-105" 
            />
            <p className="text-[10px] text-zinc-400 font-medium leading-tight max-w-[200px]">
              Cette couleur marquera vos <span className="font-bold text-zinc-600 dark:text-zinc-300">fiches produits</span>.
            </p>
          </div>
        </div>

        <button 
          disabled={isPending} 
          type="submit"
          className={`w-full p-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg active:scale-[0.98] mt-2 ${
            isEditing 
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20' 
            : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-cyan-600 dark:hover:bg-cyan-500 hover:text-white shadow-zinc-900/10'
          }`}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : isEditing ? (
            <Save size={18} />
          ) : (
            <Plus size={18} />
          )}
          {isPending ? "Synchronisation..." : isEditing ? "Appliquer les changements" : "Ajouter au catalogue"}
        </button>

        {state?.message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            state.success 
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' 
            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
          }`}>
            {state.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <p className="text-[10px] font-black uppercase tracking-tight">{state.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}