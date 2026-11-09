"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, 
  X, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { createClientNoteAction, updateClientNoteAction } from "@/app/actions/clientNoteActions";

interface NoteFormProps {
  clients: any[];
  initialData?: any;
  mode?: "create" | "edit";
  noteId?: string;
}

export default function NoteForm({ clients, initialData, mode = "create", noteId }: NoteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ Fonction pour obtenir l'ID du client (gère string ou object)
  const getClientId = (clientId: any): string => {
    if (typeof clientId === 'object' && clientId !== null) {
      return clientId._id || '';
    }
    return clientId || '';
  };

  const [formData, setFormData] = useState({
    clientId: getClientId(initialData?.clientId),
    title: initialData?.title || "",
    content: initialData?.content || "",
    category: initialData?.category || "general",
    isPinned: initialData?.isPinned || false,
  });

  // Mettre à jour le formulaire si initialData change
  useEffect(() => {
    if (initialData) {
      setFormData({
        clientId: getClientId(initialData.clientId),
        title: initialData.title || "",
        content: initialData.content || "",
        category: initialData.category || "general",
        isPinned: initialData.isPinned || false,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.clientId) {
        toast.error("Veuillez sélectionner un client");
        setIsLoading(false);
        return;
      }
      if (!formData.title.trim()) {
        toast.error("Le titre est requis");
        setIsLoading(false);
        return;
      }

      // Préparer les données pour l'API
      const formDataToSend = new FormData();
      formDataToSend.append("clientId", formData.clientId);
      formDataToSend.append("title", formData.title);
      if (formData.content) formDataToSend.append("content", formData.content);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("isPinned", formData.isPinned ? "true" : "false");

      let result;
      
      if (mode === "create") {
        result = await createClientNoteAction(null, formDataToSend);
      } else {
        if (!noteId) {
          toast.error("ID de la note manquant");
          setIsLoading(false);
          return;
        }
        result = await updateClientNoteAction(noteId, null, formDataToSend);
      }

      if (result?.success) {
        toast.success(mode === "create" ? "Note créée avec succès !" : "Note modifiée avec succès !");
        router.push("/dashboard/clients/notes");
        router.refresh();
      } else {
        toast.error(result?.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Client */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2">
          Client <span className="text-rose-400">*</span>
        </label>
        <select
          required
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
          disabled={mode === "edit"}
        >
          <option value="" className="bg-[#020617]">Sélectionner un client...</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id} className="bg-[#020617]">
              {client.name} ({client.code})
            </option>
          ))}
        </select>
        {mode === "edit" && (
          <p className="text-[8px] text-zinc-500 mt-1">Le client ne peut pas être modifié</p>
        )}
      </div>

      {/* Catégorie */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2">
          Catégorie
        </label>
        <div className="relative">
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm appearance-none"
          >
            <option value="general" className="bg-[#020617]">Général</option>
            <option value="follow-up" className="bg-[#020617]">Suivi</option>
            <option value="important" className="bg-[#020617]">Important</option>
            <option value="reminder" className="bg-[#020617]">Rappel</option>
          </select>
        </div>
      </div>

      {/* Titre */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2">
          Titre <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Appel de suivi, Relance paiement..."
          className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm placeholder:text-zinc-600"
        />
      </div>

      {/* Contenu */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2">
          Contenu
        </label>
        <textarea
          rows={6}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Détails de la note..."
          className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm placeholder:text-zinc-600 resize-none"
        />
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
        <input
          type="checkbox"
          id="pinned"
          checked={formData.isPinned}
          onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
          className="w-4 h-4 accent-amber-500"
        />
        <label htmlFor="pinned" className="text-sm font-medium text-white">
          Épingler cette note
        </label>
      </div>

      {/* Boutons */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-amber-500/20"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {isLoading ? "Enregistrement..." : (mode === "create" ? "Créer" : "Mettre à jour")}
        </button>
        
        <button
          type="button"
          onClick={() => router.push("/dashboard/clients/notes")}
          className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-xs tracking-widest text-zinc-400 hover:text-white transition-all border border-white/10 hover:border-white/20 flex items-center gap-2"
        >
          <X size={18} />
          Annuler
        </button>
      </div>
    </form>
  );
}