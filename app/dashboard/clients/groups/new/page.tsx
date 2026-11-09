import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Layers, 
  AlertCircle
} from "lucide-react";
import GroupForm from "@/app/components/Client/GroupForm";

export default async function NewClientGroupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Éléments décoratifs - Theme aware */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* ===== EN-TÊTE ===== */}
      <div className="relative flex items-center justify-between animate-slide-up">
        <Link
          href="/dashboard/clients/groups"
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-all duration-300 text-sm group font-black uppercase tracking-wider"
        >
          <div className="p-2 bg-[var(--card-bg)] backdrop-blur-sm rounded-xl border border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[var(--accent)]/10">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
          </div>
          <span>Retour aux groupes</span>
        </Link>
        
        <div className="flex items-center gap-2 text-[var(--accent)] bg-[var(--accent)]/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-[10px] font-black uppercase border border-[var(--accent)]/30 hover:scale-105 transition-all duration-300">
          <Layers size={12} className="animate-pulse" />
          Nouveau groupe de clients
        </div>
      </div>

      {/* ===== FORMULAIRE ===== */}
      <div className="relative max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {/* Effet de lueur */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/20 to-blue-600/20 rounded-[3.5rem] blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-700"></div>
        
        <div className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[3rem] overflow-hidden shadow-2xl p-8 md:p-10 hover:border-[var(--accent)]/30 transition-all duration-500">
          
          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent)]/5 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-500/5 to-transparent rounded-full blur-2xl"></div>
          
          {/* Formulaire de création de groupe */}
          <GroupForm mode="create" />
          
        </div>
      </div>

      {/* ===== AIDE CONTEXTUELLE ===== */}
      <div className="relative max-w-3xl mx-auto mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[var(--accent)]/10 rounded-xl border border-[var(--accent)]/30 group-hover:scale-110 transition-transform duration-300">
              <Layers size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider mb-2 flex items-center gap-2">
                À propos des groupes de clients
                <span className="text-[8px] bg-[var(--accent)]/20 px-2 py-0.5 rounded-full text-[var(--accent)]">Guide</span>
              </h3>
              <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
                Les groupes vous permettent de :
              </p>
              <ul className="mt-2 space-y-1 text-[9px] text-[var(--foreground-muted)]">
                {[
                  "Segmenter vos clients pour des analyses ciblées",
                  "Appliquer des remises spécifiques par groupe",
                  "Générer des rapports comparatifs entre segments",
                  "Faciliter les opérations groupées (envois d'emails, etc.)"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 group/item hover:text-[var(--accent)] transition-colors duration-200">
                    <span className="w-1 h-1 bg-[var(--accent)] rounded-full group-hover/item:scale-150 transition-transform duration-300"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}