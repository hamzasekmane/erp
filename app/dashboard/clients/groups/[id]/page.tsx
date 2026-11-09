// app/dashboard/clients/groups/[id]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Layers, 
  Users, 
  Wallet,
  Percent,
  Calendar,
  Edit,
  Settings,
  User,
  Mail,
  Phone,
  AlertCircle,
  Building2,
  UserPlus
} from "lucide-react";
import { clientGroupService } from "@/app/services/clientGroupService";
import { 
  ClientGroup, 
  GroupClient, 
  formatGroupForDisplay,
  calculateGroupStats,
  GROUP_ERROR_MESSAGES
} from "@/app/types/clientGroup.types";
import AddClientsModal from "@/app/components/Client/AddClientsModal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientGroupDetailsPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  try {
    // Récupérer les informations du groupe
    const group = await clientGroupService.getGroupById(id, token) as ClientGroup | null;

    if (!group) {
      return (
        <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-6xl mx-auto">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-12 text-center">
            <AlertCircle size={48} className="text-rose-400 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-[var(--foreground)] mb-2">Groupe non trouvé</h1>
            <p className="text-[var(--foreground-muted)] mb-6">{GROUP_ERROR_MESSAGES.NOT_FOUND}</p>
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

    // Récupérer les clients du groupe
    const clientsResponse = await clientGroupService.getGroupClients(id, token);
    const clients = (clientsResponse.data || []) as GroupClient[];

    // Formater le groupe pour l'affichage
    const displayGroup = formatGroupForDisplay(group);
    
    // Calculer les statistiques avancées
    const groupStats = calculateGroupStats(group, clients);

    return (
      <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Éléments décoratifs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        </div>

        {/* Breadcrumb */}
        <div className="text-[10px] font-black text-[var(--foreground-muted)]/40 uppercase tracking-wider">
          DASHBOARD {'>'} CLIENTS {'>'} GROUPES {'>'} {displayGroup.displayId}
        </div>

        {/* ===== EN-TÊTE ===== */}
        <div className="relative flex items-center justify-between">
          <Link
            href="/dashboard/clients/groups"
            className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-all text-sm group font-black uppercase tracking-wider"
          >
            <div className="p-2 bg-[var(--card-bg)] backdrop-blur-sm rounded-xl border border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-colors">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span>RETOUR AUX GROUPES</span>
          </Link>
        </div>

        {/* ===== TITRE DU GROUPE ===== */}
        <div className="relative">
          <div className="text-[200px] font-black text-[var(--foreground-muted)]/5 absolute -top-20 -left-10 select-none pointer-events-none">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-5xl font-black text-[var(--foreground)] uppercase tracking-tighter mb-2">
            {group.name}
          </h1>
          {group.description && (
            <p className="text-[var(--foreground-muted)] text-sm max-w-2xl">
              {group.description}
            </p>
          )}
        </div>

        {/* ===== INFORMATIONS RAPIDES ===== */}
        <div className="flex items-center gap-6 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[var(--accent)]" />
            <span className="text-[var(--foreground-muted)]">Créé le</span>
            <span className="text-[var(--foreground)] font-bold">{displayGroup.displayDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[var(--accent)]" />
            <span className="text-[var(--foreground-muted)]">ID</span>
            <span className="text-[var(--foreground)] font-mono text-[10px]">{displayGroup.displayId.toLowerCase()}</span>
          </div>
        </div>

        {/* ===== BOUTONS D'ACTION ===== */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* ✅ Bouton d'ajout de clients - UN SEUL ICI */}
          <AddClientsModal 
            groupId={id} 
            token={token}
            existingClientIds={clients.map(c => c._id)}
          />
          
          <Link
            href={`/dashboard/clients/groups/edit/${id}`}
            className="flex items-center gap-2 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/30 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider text-[var(--accent)] transition-all"
          >
            <Edit size={12} />
            MODIFIER
          </Link>
          <Link
            href={`/dashboard/clients/groups/settings/${id}`}
            className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-400 transition-all"
          >
            <Settings size={12} />
            PARAMÈTRES
          </Link>
        </div>

        {/* ===== STATISTIQUES RAPIDES ===== */}
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Encours total</p>
            <p className="text-3xl font-black text-[var(--foreground)]">
              {groupStats.totalBalance.toLocaleString()} <span className="text-sm text-[var(--foreground-muted)]">DA</span>
            </p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Remise</p>
            <p className="text-3xl font-black text-amber-400">{group.discount || 0}%</p>
          </div>
        </div>

        {/* ===== SECTION CLIENTS ===== */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
              <Users size={18} />
              CLIENTS DU GROUPE
            </h2>
            <span className="text-xs text-[var(--foreground-muted)] bg-[var(--card-bg)] px-3 py-1 rounded-full border border-[var(--border)]">
              {clients.length} client(s)
            </span>
          </div>

          {clients.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {clients.map((client: GroupClient) => (
                <Link
                  key={client._id}
                  href={`/dashboard/clients/${client._id}`}
                  className="flex items-center justify-between p-4 hover:bg-[var(--card-bg)] transition-all group/client"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--background-secondary)] to-[var(--card-bg-solid)] flex items-center justify-center text-[var(--foreground)] font-black border border-[var(--border)]">
                      {client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--foreground)] group-hover/client:text-[var(--accent)] transition-colors">
                        {client.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {client.email && (
                          <span className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                            <Mail size={8} />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                            <Phone size={8} />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[var(--foreground)]">
                      {(client.balance || 0).toLocaleString()} <span className="text-[8px] text-[var(--foreground-muted)]">DA</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 bg-[var(--card-bg)] rounded-full flex items-center justify-center border-2 border-[var(--border)]">
                  <Users size={40} className="text-[var(--foreground-muted)]" />
                </div>
                <p className="text-[var(--foreground-muted)] font-black uppercase tracking-widest text-xs">
                  AUCUN CLIENT DANS CE GROUPE
                </p>
                <p className="text-[9px] text-[var(--foreground-muted)]/60 max-w-md">
                  Commencez par ajouter des clients à ce groupe.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Note informative */}
        <div className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent backdrop-blur-sm border border-[var(--accent)]/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-[var(--accent)] flex-shrink-0" />
          <p className="text-[9px] text-[var(--foreground)]/80 leading-relaxed">
            Les statistiques de ce groupe (nombre de clients et encours total) sont calculées automatiquement 
            en fonction des clients qui lui sont assignés.
          </p>
        </div>
      </div>
    );

  } catch (error) {
    console.error("❌ Erreur lors du chargement du groupe:", error);
    
    return (
      <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-6xl mx-auto">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-12 text-center">
          <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-[var(--foreground)] mb-2">Erreur de connexion</h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            Impossible de charger les données du groupe.
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