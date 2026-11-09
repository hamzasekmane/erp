import { cookies } from "next/headers";
import { productsService } from "@/app/services/products.Service";
import CategoryForm from "@/app/components/categories/CategoryForm";
import { 
  ArrowLeft, 
  Layers, 
  Info, 
  History, 
  Fingerprint,
  Box,
  BarChart3,
  Edit3
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 1. جلب بيانات الفئة
  const response = await productsService.getCategoryById(id, token);
  if (!response?.success || !response?.data) return notFound();
  
  const category = response.data;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. TOP NAVIGATION & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link 
          href="/dashboard/categories" 
          className="flex items-center gap-2 text-zinc-400 hover:text-cyan-600 font-black uppercase text-[10px] tracking-widest transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Retour à la liste des segments
        </Link>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-black text-[10px] uppercase text-zinc-500 flex items-center gap-2">
            <Fingerprint size={14} /> ID: {id.slice(-8)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. MAIN CONTENT: EDIT FORM */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl relative overflow-hidden">
            
            {/* Artistic Watermark */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Layers size={250} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-12">
                <div 
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl"
                  style={{ backgroundColor: category.color || '#0891b2' }}
                >
                  <Edit3 size={32} />
                </div>
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                    Modifier <span className="text-cyan-600">.</span>
                  </h1>
                  <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
                    Configuration du segment
                  </p>
                </div>
              </div>

              {/* Form Component */}
              <CategoryForm 
                initialData={category} 
                isEditing={true} 
                token={token} 
              />
            </div>
          </div>
        </div>

        {/* 3. SIDEBAR: STATS & INFO */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CATEGORY METRICS CARD */}
          <div className="bg-zinc-900 text-white p-10 rounded-[3rem] shadow-2xl shadow-cyan-900/20 relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full transition-all group-hover:scale-150" />
            
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase mb-10 italic opacity-50 tracking-widest">
              <BarChart3 size={14} /> Performance Global
            </h4>

            <div className="space-y-8 relative z-10">
              <div className="flex justify-between items-end py-6 border-b border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter text-cyan-300">Articles liés</span>
                  <span className="text-6xl font-black italic tracking-tighter mt-1">
                    {category.productsCount || 0}
                  </span>
                </div>
                <Box size={40} className="text-cyan-500 opacity-20 mb-2" />
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-zinc-400 leading-relaxed italic">
                  Ce segment représente <span className="text-white">15%</span> de votre inventaire total.
                </p>
              </div>
            </div>
          </div>

          {/* SYSTEM LOGS CARD */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase mb-8 italic text-cyan-600 tracking-widest">
              <Info size={14} /> Historique Système
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <History size={16} className="text-zinc-400" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Création</span>
                </div>
                <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-200">
                  {format(new Date(category.createdAt), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Dernière MAJ</span>
                </div>
                <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-200">
                  {format(new Date(category.updatedAt), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>

            <div className="mt-8 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-[2rem]">
              <p className="text-[9px] font-bold text-amber-700 dark:text-amber-500 leading-relaxed uppercase italic">
                Attention: Modifier ce segment impactera l'affichage de tous les produits associés.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}