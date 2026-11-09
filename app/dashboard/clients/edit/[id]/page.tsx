import { cookies } from "next/headers";
import { clientService } from "@/app/services/clientService";
import { redirect } from "next/navigation";
import ClientForm from "@/app/components/Client/ClientForm";
import { ArrowRight, Edit3, AlertCircle, Settings2, Calendar, Hash } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  const response = await clientService.getFullDetails(id, token);
  
  // ✅ Correction: response a la structure { profile, stats }
  const profile = response?.profile;

  if (!profile) {
    redirect("/dashboard/clients");
  }

  // Formatage de la date de création
  const createdDate = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Date inconnue';

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Lien de retour */}
      <Link 
        href={`/dashboard/clients/${id}`} 
        className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-amber-400 transition-all text-sm w-fit group font-black uppercase tracking-wider"
      >
        <div className="p-2 bg-[var(--card-bg)] backdrop-blur-sm rounded-xl border border-[var(--border)] group-hover:border-amber-500/30 transition-colors">
          <ArrowRight size={16} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        <span>Annuler et retourner</span>
      </Link>

      {/* En-tête */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center border border-amber-500/30">
            <Edit3 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight uppercase">Modifier le client</h1>
            <p className="text-[var(--foreground-muted)] text-sm mt-0.5 font-medium">
              Vous modifiez: <span className="text-amber-400 font-bold">{profile.name}</span>
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <Settings2 size={40} className="text-[var(--foreground-muted)]/10" />
        </div>
      </div>

      {/* Informations supplémentaires sur le client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] p-4 rounded-xl flex items-center gap-3">
          <Hash size={16} className="text-[var(--accent)]" />
          <div>
            <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Code client</p>
            <p className="text-sm font-bold text-[var(--accent)]">{profile.code}</p>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] p-4 rounded-xl flex items-center gap-3">
          <Calendar size={16} className="text-[var(--accent)]" />
          <div>
            <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Client depuis</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{createdDate}</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="relative">
        <ClientForm 
          mode="edit" 
          id={id} 
          initialData={profile} 
          token={token}
        />
        
        {/* Note d'avertissement */}
        <div className="mt-6 bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm border border-amber-500/30 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
            <AlertCircle size={20} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
              ⚠️ Attention - Modification sensible
            </h4>
            <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
              La modification du nom, du code ou du type de client apparaîtra immédiatement dans toutes les factures et rapports financiers associés. 
              <span className="block mt-1 text-amber-400 font-bold">Vérifiez l'exactitude des données avant d'enregistrer.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}