import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";
import { clientImportService } from "@/app/services/clientImportService";
import ImportForm from "@/app/components/Client/ImportForm";

export default async function ClientImportPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  // Récupérer l'historique des imports récents
  const historyResponse = await clientImportService.getImportHistory(token, 1, 5);
  const recentImports = historyResponse.data || [];

  return (
    <div className="relative min-h-screen bg-[#020617] text-white p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* ===== EN-TÊTE ===== */}
      <div className="relative flex items-center justify-between">
        <Link
          href="/dashboard/clients"
          className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-all text-sm group font-black uppercase tracking-wider"
        >
          <div className="p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover:border-emerald-500/30 transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span>Retour aux clients</span>
        </Link>
        
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-[10px] font-black uppercase border border-emerald-500/30">
          <Upload size={12} className="animate-pulse" />
          Importation de clients
        </div>
      </div>

      {/* ===== TITRE ===== */}
      <div className="relative">
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter italic">
          Importer des clients
          <span className="text-emerald-400 ml-2">•</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Importez vos clients en masse à partir d'un fichier Excel ou CSV
        </p>
      </div>

      {/* ===== FORMULAIRE D'IMPORT ===== */}
      <ImportForm token={token} />

      {/* ===== HISTORIQUE DES IMPORTS RÉCENTS ===== */}
      {recentImports.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-400" />
            Imports récents
          </h2>
          
          <div className="space-y-3">
            {recentImports.map((imp: any) => (
              <div key={imp._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    imp.status === 'completed' ? 'bg-emerald-400' :
                    imp.status === 'completed_with_errors' ? 'bg-amber-400' :
                    imp.status === 'processing' ? 'bg-cyan-400 animate-pulse' :
                    imp.status === 'cancelled' ? 'bg-rose-400' : 'bg-zinc-500'
                  }`} />
                  <div>
                    <p className="text-sm font-bold text-white">{imp.fileName}</p>
                    <p className="text-[8px] text-zinc-500">
                      {new Date(imp.createdAt).toLocaleDateString('fr-FR')} • 
                      {imp.stats?.created || 0} créés, {imp.stats?.updated || 0} mis à jour
                    </p>
                  </div>
                </div>
                <span className={`text-[8px] font-black px-2 py-1 rounded-full ${
                  imp.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                  imp.status === 'completed_with_errors' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  imp.status === 'processing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                  imp.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                  'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                }`}>
                  {imp.status === 'completed' ? 'Terminé' :
                   imp.status === 'completed_with_errors' ? 'Avec erreurs' :
                   imp.status === 'processing' ? 'En cours' :
                   imp.status === 'cancelled' ? 'Annulé' : 'Échec'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== NOTES INFORMATIVES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
              Colonnes requises
            </h4>
            <p className="text-[9px] text-zinc-400">
              code, name, type (individual/company)
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
              Limitations
            </h4>
            <p className="text-[9px] text-zinc-400">
              Maximum 1000 clients par import. Fichier de 10MB maximum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}