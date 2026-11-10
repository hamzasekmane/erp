"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { createTicketAction } from "@/app/actions/supportActions";

export default function TicketForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("technical");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim()) {
      toast.error("Le sujet est obligatoire");
      return;
    }
    setLoading(true);
    const result = await createTicketAction({ subject, description, priority, category });
    setLoading(false);
    if (!result.success) {
      toast.error(result.message || "Création impossible");
      return;
    }
    toast.success("Ticket envoyé au support");
    setSubject("");
    setDescription("");
    setPriority("medium");
    router.refresh();
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Send size={18} className="text-amber-500" />
        </div>
        <h3 className="text-base font-black">Créer un ticket de support</h3>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-xs font-medium mb-1">Sujet</label>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Décrivez brièvement votre problème"
            className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Priorité</label>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="technical">Technique</option>
              <option value="account">Compte</option>
              <option value="billing">Facturation</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Détaillez votre problème..."
            className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
