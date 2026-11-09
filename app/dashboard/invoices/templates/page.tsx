import { FileSpreadsheet, Layout, Palette, Check, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";

const TEMPLATES = [
  {
    id: "modern-dark",
    name: "Modern Onyx",
    description: "Design minimaliste avec accents sombres et typographie italique.",
    previewColor: "bg-zinc-900",
    isPopular: true,
  },
  {
    id: "emerald-pro",
    name: "Emerald Professional",
    description: "Look corporate propre utilisant votre charte graphique verte.",
    previewColor: "bg-cyan-600",
    isPopular: false,
  },
  {
    id: "classic-swiss",
    name: "Classic Swiss",
    description: "Focus sur la lisibilité maximale et une grille structurée.",
    previewColor: "bg-blue-600",
    isPopular: false,
  },
];

export default function TemplatesPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 animate-in fade-in duration-700">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="relative space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-[var(--foreground)] leading-none">
            Modèles<span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-[var(--foreground-muted)] text-xs font-black uppercase tracking-[0.3em] italic opacity-70">
            Personnalisez l'apparence de vos documents
          </p>
        </div>

        {/* GRID DES MODÈLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEMPLATES.map((template) => (
            <div 
              key={template.id} 
              className="group relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              {/* PRÉVISUALISATION VISUELLE */}
              <div className={`h-48 w-full ${template.previewColor} relative flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                <Layout size={60} className="text-white/20 group-hover:scale-110 transition-transform duration-700" />
                
                {template.isPopular && (
                  <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-white text-[9px] font-black uppercase tracking-widest">
                    Plus utilisé
                  </div>
                )}
              </div>

              {/* DÉTAILS */}
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-black italic uppercase text-[var(--foreground)] tracking-tighter">
                    {template.name}
                  </h3>
                  <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg">
                    <Palette size={16} />
                  </div>
                </div>
                
                <p className="text-[var(--foreground-muted)] text-sm font-medium leading-relaxed">
                  {template.description}
                </p>

                <div className="pt-6 flex gap-3">
                  <button className="flex-1 bg-[var(--card-bg)] hover:bg-[var(--accent)]/20 border border-[var(--border)] hover:border-[var(--accent)]/30 text-[var(--foreground)] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                    <Check size={14} /> Sélectionner
                  </button>
                  <button className="p-4 bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground-muted)] rounded-2xl hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]/80 transition-colors">
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* CARTE "COMMING SOON" OU "CUSTOM" */}
          <div className="border-2 border-dashed border-[var(--border)] rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-60 hover:opacity-100 transition-opacity bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md">
             <div className="w-16 h-16 bg-[var(--card-bg)] rounded-full flex items-center justify-center text-[var(--foreground-muted)]">
               <FileSpreadsheet size={24} />
             </div>
             <div>
               <p className="font-black uppercase text-[10px] tracking-widest text-[var(--foreground-muted)]">Sur mesure</p>
               <h4 className="text-lg font-bold text-[var(--foreground)]">Besoin d'un design unique ?</h4>
             </div>
             <Link href="/contact" className="text-[var(--accent)] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
               Contactez-nous <ArrowRight size={14} />
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}