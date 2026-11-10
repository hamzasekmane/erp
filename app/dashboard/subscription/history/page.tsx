"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  CreditCard,
  FileText,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  User,
  Building2,
  Mail,
  Phone,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Types
interface SubscriptionHistoryItem {
  id: string;
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  plan: string;
  amount: number;
  status: "active" | "cancelled" | "expired" | "pending";
  action: "created" | "renewed" | "upgraded" | "downgraded" | "cancelled" | "expired";
  date: string;
  invoiceUrl?: string;
  paymentMethod: string;
}

export default function SubscriptionHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Données d'historique
  const historyData: SubscriptionHistoryItem[] = [
    {
      id: "SUB-HIST-001",
      subscriptionId: "SUB-2024-001",
      customerName: "TechCorp Solutions",
      customerEmail: "contact@techcorp.com",
      plan: "Professional",
      amount: 99,
      status: "active",
      action: "created",
      date: "2024-01-15T10:30:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Visa"
    },
    {
      id: "SUB-HIST-002",
      subscriptionId: "SUB-2024-002",
      customerName: "Innovation Labs",
      customerEmail: "admin@innovationlabs.com",
      plan: "Enterprise",
      amount: 249,
      status: "active",
      action: "upgraded",
      date: "2024-01-14T14:20:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Mastercard"
    },
    {
      id: "SUB-HIST-003",
      subscriptionId: "SUB-2023-089",
      customerName: "Digital Solutions",
      customerEmail: "billing@digitalsolutions.com",
      plan: "Professional",
      amount: 99,
      status: "active",
      action: "renewed",
      date: "2024-01-10T09:15:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Visa"
    },
    {
      id: "SUB-HIST-004",
      subscriptionId: "SUB-2023-045",
      customerName: "Startup Hub",
      customerEmail: "info@startuphub.com",
      plan: "Starter",
      amount: 49,
      status: "cancelled",
      action: "cancelled",
      date: "2024-01-05T16:45:00Z",
      invoiceUrl: "#",
      paymentMethod: "PayPal"
    },
    {
      id: "SUB-HIST-005",
      subscriptionId: "SUB-2024-003",
      customerName: "Cloud Systems",
      customerEmail: "sales@cloudsystems.com",
      plan: "Professional",
      amount: 99,
      status: "active",
      action: "created",
      date: "2024-01-03T11:00:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Visa"
    },
    {
      id: "SUB-HIST-006",
      subscriptionId: "SUB-2023-112",
      customerName: "Data Analytics Pro",
      customerEmail: "contact@dataanalytics.com",
      plan: "Enterprise",
      amount: 249,
      status: "expired",
      action: "expired",
      date: "2023-12-28T08:30:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Mastercard"
    },
    {
      id: "SUB-HIST-007",
      subscriptionId: "SUB-2023-078",
      customerName: "Web Solutions",
      customerEmail: "info@websolutions.com",
      plan: "Starter",
      amount: 49,
      status: "cancelled",
      action: "downgraded",
      date: "2023-12-20T13:15:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Visa"
    },
    {
      id: "SUB-HIST-008",
      subscriptionId: "SUB-2023-156",
      customerName: "E-Commerce Plus",
      customerEmail: "billing@ecommerceplus.com",
      plan: "Professional",
      amount: 99,
      status: "active",
      action: "renewed",
      date: "2023-12-15T10:00:00Z",
      invoiceUrl: "#",
      paymentMethod: "PayPal"
    },
    {
      id: "SUB-HIST-009",
      subscriptionId: "SUB-2023-134",
      customerName: "Mobile Apps Co",
      customerEmail: "contact@mobileapps.com",
      plan: "Starter",
      amount: 49,
      status: "expired",
      action: "expired",
      date: "2023-12-10T14:30:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Visa"
    },
    {
      id: "SUB-HIST-010",
      subscriptionId: "SUB-2023-198",
      customerName: "Consulting Group",
      customerEmail: "admin@consultinggroup.com",
      plan: "Enterprise",
      amount: 249,
      status: "active",
      action: "upgraded",
      date: "2023-12-05T09:45:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Mastercard"
    },
    {
      id: "SUB-HIST-011",
      subscriptionId: "SUB-2023-167",
      customerName: "Marketing Pro",
      customerEmail: "info@marketingpro.com",
      plan: "Professional",
      amount: 99,
      status: "cancelled",
      action: "cancelled",
      date: "2023-11-28T11:20:00Z",
      invoiceUrl: "#",
      paymentMethod: "Carte Visa"
    },
    {
      id: "SUB-HIST-012",
      subscriptionId: "SUB-2023-145",
      customerName: "Real Estate Hub",
      customerEmail: "contact@realestatehub.com",
      plan: "Starter",
      amount: 49,
      status: "expired",
      action: "expired",
      date: "2023-11-20T15:00:00Z",
      invoiceUrl: "#",
      paymentMethod: "PayPal"
    }
  ];

  // Statistiques
  const stats = {
    total: historyData.length,
    active: historyData.filter(item => item.status === "active").length,
    cancelled: historyData.filter(item => item.status === "cancelled").length,
    expired: historyData.filter(item => item.status === "expired").length,
    totalRevenue: historyData.reduce((sum, item) => sum + item.amount, 0),
    created: historyData.filter(item => item.action === "created").length,
    renewed: historyData.filter(item => item.action === "renewed").length,
    upgraded: historyData.filter(item => item.action === "upgraded").length,
    cancelled_actions: historyData.filter(item => item.action === "cancelled").length
  };

  // Filtrage des données
  const filteredData = historyData.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subscriptionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesAction = actionFilter === "all" || item.action === actionFilter;
    
    return matchesSearch && matchesStatus && matchesAction;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "cancelled": return "bg-rose-500/10 text-rose-500 border-rose-500/30";
      case "expired": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "pending": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "active": return "ACTIF";
      case "cancelled": return "ANNULÉ";
      case "expired": return "EXPIRÉ";
      case "pending": return "EN ATTENTE";
      default: return status.toUpperCase();
    }
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case "created": return "bg-emerald-500/10 text-emerald-500";
      case "renewed": return "bg-blue-500/10 text-blue-500";
      case "upgraded": return "bg-purple-500/10 text-purple-500";
      case "downgraded": return "bg-amber-500/10 text-amber-500";
      case "cancelled": return "bg-rose-500/10 text-rose-500";
      case "expired": return "bg-gray-500/10 text-gray-500";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getActionText = (action: string) => {
    switch(action) {
      case "created": return "Création";
      case "renewed": return "Renouvellement";
      case "upgraded": return "Upgrade";
      case "downgraded": return "Downgrade";
      case "cancelled": return "Annulation";
      case "expired": return "Expiration";
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case "created": return <CheckCircle size={12} />;
      case "renewed": return <RefreshCw size={12} />;
      case "upgraded": return <TrendingUp size={12} />;
      case "downgraded": return <TrendingDown size={12} />;
      case "cancelled": return <XCircle size={12} />;
      case "expired": return <Clock size={12} />;
      default: return <AlertCircle size={12} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/subscription"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <History size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • HISTORY
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● ARCHIVE
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Historique des <span className="text-[var(--accent)]">Abonnements</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Consultez l'historique complet de tous les abonnements
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
              <RefreshCw size={16} className="text-[var(--foreground-muted)]" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--accent)]/10 transition-colors">
              <Download size={14} />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase">Total</p>
            <p className="text-xl font-black">{stats.total}</p>
            <p className="text-[8px] text-[var(--foreground-muted)]">événements</p>
          </div>
          
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <p className="text-[9px] font-black text-emerald-500 uppercase">Actifs</p>
            <p className="text-xl font-black text-emerald-500">{stats.active}</p>
          </div>
          
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
            <p className="text-[9px] font-black text-rose-500 uppercase">Annulés</p>
            <p className="text-xl font-black text-rose-500">{stats.cancelled}</p>
          </div>
          
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-[9px] font-black text-amber-500 uppercase">Expirés</p>
            <p className="text-xl font-black text-amber-500">{stats.expired}</p>
          </div>
          
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <p className="text-[9px] font-black text-purple-500 uppercase">Créations</p>
            <p className="text-xl font-black text-purple-500">{stats.created}</p>
          </div>
          
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <p className="text-[9px] font-black text-blue-500 uppercase">Renouvellements</p>
            <p className="text-xl font-black text-blue-500">{stats.renewed}</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Rechercher par client, email ou ID d'abonnement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="cancelled">Annulés</option>
              <option value="expired">Expirés</option>
              <option value="pending">En attente</option>
            </select>
            
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">Toutes les actions</option>
              <option value="created">Créations</option>
              <option value="renewed">Renouvellements</option>
              <option value="upgraded">Upgrades</option>
              <option value="downgraded">Downgrades</option>
              <option value="cancelled">Annulations</option>
              <option value="expired">Expirations</option>
            </select>
          </div>
        </div>

        {/* HISTORY TABLE */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]/50">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <Receipt size={14} className="text-[var(--accent)]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-tight">
                  Journal des événements
                </span>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                  {filteredData.length} événement{filteredData.length > 1 ? 's' : ''} trouvé{filteredData.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Date</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Client</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Abonnement</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Action</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Plan</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Montant</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Paiement</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase">Statut</th>
                    <th className="p-4 text-center text-[10px] font-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--background)]/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-[var(--foreground-muted)]" />
                          <span className="text-xs">{formatDate(item.date)}</span>
                        </div>
                       </td>
                      
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium">{item.customerName}</p>
                          <p className="text-[10px] text-[var(--foreground-muted)]">{item.customerEmail}</p>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <p className="text-xs font-mono text-[var(--foreground-muted)]">{item.subscriptionId}</p>
                      </td>
                      
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${getActionColor(item.action)}`}>
                          {getActionIcon(item.action)}
                          {getActionText(item.action)}
                        </span>
                      </td>
                      
                      <td className="p-4">
                        <span className="text-sm">{item.plan}</span>
                      </td>
                      
                      <td className="p-4">
                        <span className="text-sm font-medium">{item.amount}€</span>
                      </td>
                      
                      <td className="p-4">
                        <span className="text-xs text-[var(--foreground-muted)]">{item.paymentMethod}</span>
                      </td>
                      
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black border ${getStatusColor(item.status)}`}>
                          {item.status === "active" && <CheckCircle size={10} />}
                          {item.status === "cancelled" && <XCircle size={10} />}
                          {item.status === "expired" && <Clock size={10} />}
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                            <Eye size={14} className="text-[var(--foreground-muted)]" />
                          </button>
                          <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                            <FileText size={14} className="text-[var(--foreground-muted)]" />
                          </button>
                          <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                            <MoreVertical size={14} className="text-[var(--foreground-muted)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-transparent rounded-2xl animate-pulse" />
                <div className="relative w-20 h-20 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center border-2 border-[var(--border)]">
                  <History size={32} className="text-[var(--foreground-muted)]" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                  Aucun résultat trouvé
                </p>
                <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-2 font-mono">
                  Aucun événement ne correspond à vos critères
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="p-5 border-t border-[var(--border)] flex justify-between items-center">
              <p className="text-[10px] text-[var(--foreground-muted)]">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredData.length)} sur {filteredData.length} résultats
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[var(--accent)] text-white'
                            : 'hover:bg-[var(--accent)]/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Subscription History • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Données historiques depuis 2023
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}