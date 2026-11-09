import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  Calendar,
  DollarSign
} from "lucide-react";

export const metadata: Metadata = {
  title: "Velora ERP | Factures archivées",
  description: "Consultez et gérez vos factures archivées",
};

interface ArchivedInvoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  date: string;
  archivedDate: string;
  status: "archived" | "pending_deletion";
}

export default async function ArchivedInvoicesPage() {
  // Mock data - replace with real API call
  const archivedInvoices: ArchivedInvoice[] = [
    {
      id: "1",
      number: "INV-2023-001",
      client: "Tech Solutions SARL",
      amount: 1250.00,
      date: "2023-01-15",
      archivedDate: "2024-01-15",
      status: "archived",
    },
    {
      id: "2",
      number: "INV-2023-002",
      client: "Digital Agency Pro",
      amount: 890.50,
      date: "2023-02-20",
      archivedDate: "2024-02-20",
      status: "archived",
    },
    {
      id: "3",
      number: "INV-2023-003",
      client: "Consulting Group",
      amount: 3200.00,
      date: "2023-03-10",
      archivedDate: "2024-03-10",
      status: "pending_deletion",
    },
  ];

  const totalAmount = archivedInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
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
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl">
              <FileText size={20} className="text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                  VELORA • ARCHIVES
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Factures <span className="text-blue-500">archivées</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Consultez et gérez vos factures historiques
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
            <RefreshCw size={14} />
            Exporter tout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Total factures</p>
          <p className="text-2xl font-black text-blue-500">{archivedInvoices.length}</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Montant total</p>
          <p className="text-2xl font-black text-emerald-500">{totalAmount.toLocaleString()} €</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">À supprimer</p>
          <p className="text-2xl font-black text-amber-500">
            {archivedInvoices.filter(i => i.status === "pending_deletion").length}
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Rechercher une facture..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button className="px-4 py-2 border border-[var(--border)] rounded-xl text-sm flex items-center gap-2 hover:border-blue-500/50 transition-colors">
          <Filter size={14} />
          Filtres
        </button>
        <button className="px-4 py-2 border border-[var(--border)] rounded-xl text-sm flex items-center gap-2 hover:border-blue-500/50 transition-colors">
          <Calendar size={14} />
          Période
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <tr>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">N° Facture</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Client</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Montant</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Archivée le</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors">
                  <td className="p-4 text-sm font-mono font-medium">{invoice.number}</td>
                  <td className="p-4 text-sm">{invoice.client}</td>
                  <td className="p-4 text-sm font-medium text-emerald-500">{invoice.amount.toLocaleString()} €</td>
                  <td className="p-4 text-sm text-[var(--foreground-muted)]">{invoice.date}</td>
                  <td className="p-4 text-sm text-[var(--foreground-muted)]">{invoice.archivedDate}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors" title="Voir">
                        <Eye size={16} className="text-blue-500" />
                      </button>
                      <button className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Restaurer">
                        <RefreshCw size={16} className="text-emerald-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}