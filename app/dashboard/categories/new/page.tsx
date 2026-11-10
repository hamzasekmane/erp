import Link from "next/link";
import { ArrowLeft, Layers, Sparkles, ShieldCheck } from "lucide-react";
import CategoryForm from "@/app/components/categories/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* BARRE DE NAVIGATION SUPÉRIEURE */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/categories" 
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all font-black uppercase text-[10px] tracking-[0.2em]"
        >
          <ArrowLeft size={16} /> Retour à l'index
        </Link>
        <div className="hidden md:flex items-center gap-2 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-100 dark:border-cyan-900/50">
          <Sparkles size={12} /> Mode Configuration Système
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* COLONNE DE CONTEXTE (GAUCHE) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="w-20 h-20 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3">
            <Layers size={32} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter leading-[0.9] text-zinc-900 dark:text-white">
              Créer un <br /> <span className="text-cyan-600">Nouveau Segment</span>
            </h1>
            <p className="text-zinc-500 font-bold text-xs uppercase leading-relaxed tracking-tight">
              L'organisation par segments permet une analyse précise de vos performances commerciales et une gestion optimisée de la chaîne logistique.
            </p>
          </div>

          <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
              <ShieldCheck size={20} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Validation Directe</span>
            </div>
            <p className="text-[9px] text-zinc-400 font-bold uppercase leading-normal">
              Chaque segment créé est immédiatement disponible pour l'étiquetage de vos produits et la génération de rapports.
            </p>
          </div>
        </div>

        {/* COLONNE DU FORMULAIRE (DROITE) */}
        <div className="lg:col-span-8">
          <CategoryForm />
          
          {/* NOTE DE BAS DE PAGE */}
          <p className="mt-8 text-center text-[9px] font-black uppercase text-zinc-300 dark:text-zinc-600 tracking-[0.3em]">
            Système d'Inventaire Propulsé par Gemini AI v3.0
          </p>
        </div>

      </div>
    </div>
  );
}