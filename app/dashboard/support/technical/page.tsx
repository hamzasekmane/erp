import { Metadata } from "next";
import { listTicketsAction } from "@/app/actions/supportActions";
import TicketForm from "@/app/components/support/TicketForm";
import Link from "next/link";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Send,
  FileText,
  LifeBuoy,
  Headphones,
  Globe
} from "lucide-react";

export const metadata: Metadata = {
  title: "Support Technique | Velora ERP",
  description: "Assistance technique et support pour Velora ERP",
};

interface Ticket {
  id: string;
  title: string;
  status: "open" | "in-progress" | "resolved";
  date: string;
  priority: "high" | "medium" | "low";
}

const STATUS_MAP: Record<string, Ticket["status"]> = {
  open: "open",
  in_progress: "in-progress",
  pending: "in-progress",
  resolved: "resolved",
  closed: "resolved",
};

export default async function TechnicalSupportPage() {
  const result = await listTicketsAction(5);
  const recentTickets: Ticket[] = result.tickets.map((ticket) => ({
    id: ticket.id.slice(0, 8).toUpperCase(),
    title: ticket.subject,
    status: STATUS_MAP[ticket.status] ?? "open",
    date: ticket.createdAt.slice(0, 10),
    priority: (ticket.priority === "urgent" ? "high" : ticket.priority) as Ticket["priority"],
  }));

  const getStatusColor = (status: string) => {
    switch(status) {
      case "open": return "text-amber-500 bg-amber-500/10";
      case "in-progress": return "text-blue-500 bg-blue-500/10";
      case "resolved": return "text-emerald-500 bg-emerald-500/10";
      default: return "text-[var(--foreground-muted)] bg-[var(--accent)]/5";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "open": return "Ouvert";
      case "in-progress": return "En cours";
      case "resolved": return "Résolu";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "high": return "text-red-500";
      case "medium": return "text-amber-500";
      case "low": return "text-emerald-500";
      default: return "text-[var(--foreground-muted)]";
    }
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
                <Headphones size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    VELORA • SUPPORT
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Support Technique
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                  Assistance rapide et professionnelle
                </p>
              </div>
            </div>
          </div>
          
          {/* Support Hours */}
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <p className="text-[10px] font-black text-emerald-500 uppercase">Disponible</p>
              <p className="text-xs font-black">24/7</p>
            </div>
          </div>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/50 transition-all">
            <div className="p-2 bg-blue-500/10 rounded-lg w-fit mb-4">
              <MessageCircle size={20} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-black mb-2">Chat en direct</h3>
            <p className="text-xs text-[var(--foreground-muted)] mb-4">Réponse instantanée de notre équipe</p>
            <button className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">
              Démarrer un chat
            </button>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/50 transition-all">
            <div className="p-2 bg-purple-500/10 rounded-lg w-fit mb-4">
              <Mail size={20} className="text-purple-500" />
            </div>
            <h3 className="text-lg font-black mb-2">Email</h3>
            <p className="text-xs text-[var(--foreground-muted)] mb-4">Réponse sous 24h ouvrables</p>
            <button className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">
              Envoyer un email
            </button>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/50 transition-all">
            <div className="p-2 bg-green-500/10 rounded-lg w-fit mb-4">
              <Phone size={20} className="text-green-500" />
            </div>
            <h3 className="text-lg font-black mb-2">Téléphone</h3>
            <p className="text-xs text-[var(--foreground-muted)] mb-4">Lun-Ven, 9h-18h</p>
            <button className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">
              Nous appeler
            </button>
          </div>
        </div>

        <TicketForm />

        {/* Recent Tickets */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText size={18} className="text-blue-500" />
            </div>
            <h3 className="text-base font-black">Tickets récents</h3>
          </div>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ticket.title}</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">{ticket.id} • {ticket.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority === "high" ? "Haute" : ticket.priority === "medium" ? "Moyenne" : "Basse"}
                  </span>
                  <ArrowRight size={14} className="text-[var(--foreground-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-r from-[var(--accent)]/10 to-transparent rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <LifeBuoy size={18} className="text-emerald-500" />
            </div>
            <h3 className="text-base font-black">Foire aux questions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Comment réinitialiser mon mot de passe ?</p>
              <p className="text-xs text-[var(--foreground-muted)]">Rendez-vous dans Paramètres {">"} Sécurité {">"} Changer le mot de passe</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Comment ajouter un utilisateur ?</p>
              <p className="text-xs text-[var(--foreground-muted)]">Allez dans Utilisateurs {">"} Ajouter un utilisateur</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Comment configurer les paiements ?</p>
              <p className="text-xs text-[var(--foreground-muted)]">Section Paiement {">"} Méthodes de paiement</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Où trouver mes factures ?</p>
              <p className="text-xs text-[var(--foreground-muted)]">Facturation {">"} Historique des factures</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}