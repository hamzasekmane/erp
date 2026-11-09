import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  AlertCircle
} from "lucide-react";
import { clientService } from "@/app/services/clientService";
import NoteForm from "@/app/components/Client/NoteForm";

export default async function NewClientNotePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  // Récupérer la liste des clients pour le sélecteur
  const clientsResponse = await clientService.getAllClients(token);
  const clients = clientsResponse.data || [];

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
          <FileText size={12} className="animate-pulse" />
          Nouvelle note
        </div>
      </div>

      {/* ===== FORMULAIRE ===== */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-[3rem] blur-xl opacity-25"></div>
        
        <div className="relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl p-8 md:p-10">
          
          {/* ✅ Formulaire avec clients dynamiques */}
          <NoteForm clients={clients} mode="create" />
          
        </div>
      </div>

      {/* ===== STATISTIQUES RAPIDES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-[8px] font-black uppercase text-zinc-500">Total clients</p>
          <p className="text-xl font-black text-white">{clients.length}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-[8px] font-black uppercase text-zinc-500">Catégories</p>
          <p className="text-xl font-black text-white">4</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-[8px] font-black uppercase text-zinc-500">Statut</p>
          <p className="text-xs font-black text-emerald-400">Prêt</p>
        </div>
      </div>

      {/* ===== NOTE INFORMATIVE ===== */}
      <div className="bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
        <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Les notes vous permettent de suivre vos interactions avec les clients, 
          de noter des informations importantes et de programmer des rappels.
        </p>
      </div>
    </div>
  );
}