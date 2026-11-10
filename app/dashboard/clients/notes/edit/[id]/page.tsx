import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Edit3,
  AlertCircle,
  Calendar,
  User,
  Hash
} from "lucide-react";
import { clientNoteService } from "@/app/services/clientNoteService";
import { clientService } from "@/app/services/clientService";
import NoteForm from "@/app/components/Client/NoteForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientNotePage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  // Récupérer la note
  const note = await clientNoteService.getNoteById(id, token);

  if (!note) {
    redirect("/dashboard/clients/notes");
  }

  // Récupérer la liste des clients pour le sélecteur
  const clientsResponse = await clientService.getAllClients(token);
  const clients = clientsResponse.data || [];

  // ✅ Fonction pour obtenir le nom du client (gère string ou object)
  const getClientName = (clientId: any): string => {
    if (typeof clientId === 'object' && clientId !== null) {
      return clientId.name || 'Client inconnu';
    }
    // Si c'est un string, chercher le client dans la liste
    const client = clients.find(c => c._id === clientId);
    return client?.name || 'Client inconnu';
  };

  // Formatage de la date
  const createdDate = note.createdAt 
    ? new Date(note.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Date inconnue';

  return (
    <div className="relative min-h-screen bg-[#020617] text-white p-4 md:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* ===== EN-TÊTE ===== */}
      <div className="relative flex items-center justify-between">
        <Link
          href="/dashboard/clients/notes"
          className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-all text-sm group font-black uppercase tracking-wider"
        >
          <div className="p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover:border-amber-500/30 transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span>Retour aux notes</span>
        </Link>
        
        <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-[10px] font-black uppercase border border-amber-500/30">
          <Edit3 size={12} className="animate-pulse" />
          Modifier la note
        </div>
      </div>

      {/* ===== TITRE ===== */}
      <div className="relative">
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter italic">
          Modifier la note
          <span className="text-amber-400 ml-2">•</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Vous modifiez la note <span className="text-amber-400 font-bold">"{note.title}"</span>
        </p>
      </div>

      {/* ===== INFORMATIONS RAPIDES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-center gap-3">
          <Hash size={16} className="text-cyan-400" />
          <div>
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">ID</p>
            <p className="text-xs font-mono text-cyan-400">{note._id.slice(-8)}</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-center gap-3">
          <User size={16} className="text-cyan-400" />
          <div>
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Client</p>
            <p className="text-xs font-bold text-white">{getClientName(note.clientId)}</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-center gap-3">
          <Calendar size={16} className="text-cyan-400" />
          <div>
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Créé le</p>
            <p className="text-xs font-bold text-white">{createdDate}</p>
          </div>
        </div>
      </div>

      {/* ===== FORMULAIRE ===== */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-[3rem] blur-xl opacity-25"></div>
        
        <div className="relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl p-8 md:p-10">
          
          {/* ✅ Formulaire d'édition avec données initiales */}
          <NoteForm 
            clients={clients} 
            mode="edit" 
            noteId={id}
            initialData={note} 
          />
          
        </div>
      </div>

      {/* ===== NOTE INFORMATIVE ===== */}
      <div className="bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
        <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          La modification d'une note mettra à jour son contenu et sa date de modification. 
          L'historique des versions n'est pas conservé.
        </p>
      </div>
    </div>
  );
}