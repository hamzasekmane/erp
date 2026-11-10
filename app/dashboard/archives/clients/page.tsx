import { Metadata } from "next";
import { serverApi } from "@/app/lib/serverApi";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Search,
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  Filter,
  Calendar,
  Eye
} from "lucide-react";

export const metadata: Metadata = {
  title: "Velora ERP | Clients archivés",
  description: "Consultez et gérez vos clients archivés",
};

interface ArchivedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalInvoices: number;
  lastOrder: string;
  archivedDate: string;
  status: "archived" | "pending_deletion";
}

interface ArchivedRow {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  size?: number;
  createdAt?: string;
}

export default async function ArchivedClientsPage() {
  const rows = (await serverApi<ArchivedRow[]>("/archives/documents?category=client&limit=100")) ?? [];
  const archivedClients: ArchivedClient[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: "—",
    phone: "—",
    totalInvoices: 0,
    lastOrder: "",
    archivedDate: (row.createdAt ?? "").slice(0, 10),
    status: "archived" as const,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/archives"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl">
              <Users size={20} className="text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                  VELORA • ARCHIVES
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Clients <span className="text-emerald-500">archivés</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gérez vos anciens clients et prospects inactifs
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button className="px-4 py-2 text-sm bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
            <RefreshCw size={14} />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Total clients</p>
          <p className="text-2xl font-black text-emerald-500">{archivedClients.length}</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Factures totales</p>
          <p className="text-2xl font-black text-blue-500">
            {archivedClients.reduce((sum, c) => sum + c.totalInvoices, 0)}
          </p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">À supprimer</p>
          <p className="text-2xl font-black text-amber-500">
            {archivedClients.filter(c => c.status === "pending_deletion").length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <button className="px-4 py-2 border border-[var(--border)] rounded-xl text-sm flex items-center gap-2 hover:border-emerald-500/50 transition-colors">
          <Filter size={14} />
          Filtres
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {archivedClients.map((client) => (
          <div key={client.id} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:border-emerald-500/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Users size={20} className="text-emerald-500" />
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-gray-500/20 text-gray-500">
                Archivé
              </span>
            </div>
            
            <h3 className="text-lg font-black mb-1">{client.name}</h3>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Mail size={14} />
                <span className="text-xs">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Phone size={14} />
                <span className="text-xs">{client.phone}</span>
              </div>
              <div className="flex justify-between pt-2 text-xs">
                <span>Factures: {client.totalInvoices}</span>
                <span>Dernière commande: {client.lastOrder}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
              <button className="flex-1 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1">
                <Eye size={12} />
                Voir
              </button>
              <button className="flex-1 px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                <RefreshCw size={12} />
                Restaurer
              </button>
              <button className="px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}