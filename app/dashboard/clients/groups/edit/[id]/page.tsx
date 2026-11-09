import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Layers, 
  Edit3,
  AlertCircle,
  Calendar,
  Hash,
  Settings2
} from "lucide-react";
import { clientGroupService } from "@/app/services/clientGroupService";
import GroupForm from "@/app/components/Client/GroupForm";
import { ClientGroup } from "@/app/types/clientGroup.types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientGroupPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  try {
    // Récupérer les informations du groupe
    const group = await clientGroupService.getGroupById(id, token);

    if (!group) {
      redirect("/dashboard/clients/groups");
    }

    // ✅ Nettoyer les données pour le formulaire
    const cleanGroupData: Partial<ClientGroup> = {
      _id: group._id,
      name: group.name,
      description: group.description ?? undefined,
      color: group.color ?? undefined,
      discount: group.discount ?? 0,
      groupedBilling: group.groupedBilling ?? false,
      clientCount: group.clientCount ?? 0,
      totalBalance: group.totalBalance ?? 0,
      createdAt: group.createdAt,
      clients: group.clients,
    };

    // Formater la date de création
    const createdDate = group.createdAt 
      ? new Date(group.createdAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Date inconnue';

    return (
      <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Éléments décoratifs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        </div>

        {/* ===== EN-TÊTE ===== */}
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <Link
            href={`/dashboard/clients/groups/${id}`}
            className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-amber-400 transition-all text-sm group font-black uppercase tracking-wider"
          >
            <div className="p-2 bg-[var(--card-bg)] backdrop-blur-sm rounded-xl border border-[var(--border)] group-hover:border-amber-500/30 transition-colors">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span>Retour au groupe</span>
          </Link>
          
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-[10px] font-black uppercase border border-amber-500/30">
            <Edit3 size={12} className="animate-pulse" />
            Modification du groupe
          </div>
        </div>

        {/* ===== TITRE ===== */}
        <div className="relative">
          <div className="text-[120px] font-black text-[var(--foreground-muted)]/5 absolute -top-16 -left-5 select-none pointer-events-none">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-4xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">
            Modifier le groupe
            <span className="text-amber-400 ml-2">•</span>
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-2">
            Vous modifiez le groupe <span className="text-amber-400 font-bold">{group.name}</span>
          </p>
        </div>

        {/* ===== INFORMATIONS RAPIDES ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] p-4 rounded-xl flex items-center gap-3">
            <Hash size={16} className="text-[var(--accent)]" />
            <div>
              <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">ID du groupe</p>
              <p className="text-sm font-bold text-[var(--accent)]">{group._id.slice(-8)}</p>
            </div>
          </div>
          <div className="bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] p-4 rounded-xl flex items-center gap-3">
            <Calendar size={16} className="text-[var(--accent)]" />
            <div>
              <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Créé le</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{createdDate}</p>
            </div>
          </div>
        </div>

        {/* ===== FORMULAIRE ===== */}
        <div className="relative">
          {/* Effet de lueur */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-[3.5rem] blur-xl opacity-25"></div>
          
          <div className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[3rem] overflow-hidden shadow-2xl p-8 md:p-10">
            
            {/* ✅ Formulaire d'édition avec les données nettoyées */}
            <GroupForm 
              mode="edit" 
              groupId={id} 
              initialData={cleanGroupData} 
              token={token}
            />
            
          </div>
        </div>

        {/* ===== NOTE INFORMATIVE ===== */}
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
            <AlertCircle size={20} className="text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider mb-1">
              ⚠️ Modification des paramètres
            </h4>
            <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
              La modification des paramètres de ce groupe (nom, description, couleur, remise) 
              affectera toutes les futures opérations liées à ce groupe.
            </p>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error("❌ Erreur lors du chargement du groupe:", error);
    
    // Page d'erreur
    return (
      <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-3xl mx-auto">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-12 text-center">
          <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-[var(--foreground)] mb-2">Erreur de chargement</h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            Impossible de charger les données du groupe. Veuillez réessayer.
          </p>
          <Link
            href="/dashboard/clients/groups"
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={16} />
            Retour aux groupes
          </Link>
        </div>
      </div>
    );
  }
}