import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Settings, 
  Users, 
  Percent, 
  AlertCircle,
  RefreshCw,
  Edit
} from "lucide-react";
import { clientGroupService } from "@/app/services/clientGroupService";
import DeleteGroupButton from "@/app/components/Client/DeleteGroupButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientGroupSettingsPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  // Récupérer les informations du groupe
  const group = await clientGroupService.getGroupById(id, token);

  if (!group) {
    redirect("/dashboard/clients/groups");
  }

  return (
    <div className="relative min-h-screen bg-[#020617] text-white p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* ===== EN-TÊTE ===== */}
      <div className="relative flex items-center justify-between">
        <Link
          href={`/dashboard/clients/groups/${id}`}
          className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-all text-sm group font-black uppercase tracking-wider"
        >
          <div className="p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover:border-amber-500/30 transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span>Retour au groupe</span>
        </Link>
        
        <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-[10px] font-black uppercase border border-amber-500/30">
          <Settings size={12} className="animate-pulse" />
          Paramètres du groupe
        </div>
      </div>

      {/* ===== TITRE ===== */}
      <div className="relative">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
          Paramètres
          <span className="text-amber-400 ml-2">•</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Gérez les préférences et la configuration du groupe <span className="text-amber-400 font-bold">{group.name}</span>
        </p>
      </div>

      {/* ===== GRILLE DES PARAMÈTRES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Carte 1: Informations générales */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <Users size={20} className="text-cyan-400" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Informations</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Nom du groupe</span>
              <span className="text-sm font-bold text-white">{group.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Description</span>
              <span className="text-sm font-bold text-white">{group.description || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Couleur</span>
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${group.color || 'from-cyan-500 to-blue-600'}`} />
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Date de création</span>
              <span className="text-sm font-bold text-white">
                {new Date(group.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {/* Carte 2: Statistiques */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <RefreshCw size={20} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Statistiques</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Nombre de clients</span>
              <span className="text-2xl font-black text-cyan-400">{group.clientCount || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Encours total</span>
              <span className="text-lg font-black text-white">
                {(group.totalBalance || 0).toLocaleString()} <span className="text-xs text-zinc-500">DA</span>
              </span>
            </div>
          </div>
        </div>

        {/* Carte 3: Paramètres de facturation */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Percent size={20} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Facturation</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Remise spéciale</span>
              <span className="text-lg font-black text-amber-400">{group.discount || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">Facturation groupée</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                group.groupedBilling 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
              }`}>
                {group.groupedBilling ? 'Activée' : 'Désactivée'}
              </span>
            </div>
          </div>
        </div>

        {/* Carte 4: Actions - ✅ Utilisation du composant client */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <AlertCircle size={20} className="text-rose-400" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Actions</h3>
          </div>
          
          <div className="space-y-3">
            <Link
              href={`/dashboard/clients/groups/edit/${id}`}
              className="w-full py-3 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-between group/edit transition-all"
            >
              <span className="text-xs font-black text-cyan-400 uppercase">Modifier le groupe</span>
              <Edit size={16} className="text-cyan-400 group-hover/edit:translate-x-1 transition-transform" />
            </Link>
            
            {/* ✅ Bouton de suppression (Client Component) */}
            <DeleteGroupButton groupId={id} groupName={group.name} />
          </div>
        </div>
      </div>

      {/* ===== NOTE INFORMATIVE ===== */}
      <div className="bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
          <AlertCircle size={20} className="text-amber-400" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
            ⚠️ Modification des paramètres
          </h4>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Les modifications des paramètres de facturation (remise, facturation groupée) 
            affecteront toutes les futures factures des clients de ce groupe.
          </p>
        </div>
      </div>
    </div>
  );
}