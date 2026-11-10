"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  FileText,
  Eye,
  ArrowRightLeft
} from "lucide-react";

export default function PaymentReconciliationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const reconciliations = [
    { id: "REC-001", date: "2024-01-15", bankAmount: 12450, systemAmount: 12450, difference: 0, status: "matched", transactions: 142, bankRef: "BNP-2024-001" },
    { id: "REC-002", date: "2024-01-14", bankAmount: 9800, systemAmount: 9750, difference: 50, status: "partial", transactions: 108, bankRef: "BNP-2024-002" },
    { id: "REC-003", date: "2024-01-13", bankAmount: 11200, systemAmount: 11200, difference: 0, status: "matched", transactions: 125, bankRef: "BNP-2024-003" },
    { id: "REC-004", date: "2024-01-12", bankAmount: 8900, systemAmount: 8900, difference: 0, status: "matched", transactions: 98, bankRef: "BNP-2024-004" },
    { id: "REC-005", date: "2024-01-11", bankAmount: 6500, systemAmount: 6420, difference: 80, status: "unmatched", transactions: 72, bankRef: "BNP-2024-005" }
  ];

  const stats = {
    totalMatched: 3,
    totalPartial: 1,
    totalUnmatched: 1,
    totalAmount: 48850,
    totalDifference: 130
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "matched": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "partial": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "unmatched": return "bg-rose-500/10 text-rose-500 border-rose-500/30";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "matched": return "Rapproché";
      case "partial": return "Partiel";
      case "unmatched": return "Non rapproché";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "matched": return <CheckCircle size={12} />;
      case "partial": return <AlertCircle size={12} />;
      case "unmatched": return <XCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const filteredReconciliations = reconciliations.filter(rec => {
    const matchesSearch = searchTerm === "" || 
      rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.bankRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/payment"
            className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
          >
            <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
          </Link>
          <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
            <ArrowRightLeft size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                VELORA • PAYMENT
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                ● RECONCILIATION
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
              Rapprochement <span className="text-[var(--accent)]">Bancaire</span>
            </h1>
            <p className="text-xs text-[var(--foreground-muted)] font-mono">
              Comparez les transactions système avec les relevés bancaires
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase">Total journées</p>
            <p className="text-2xl font-black">{reconciliations.length}</p>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <p className="text-[9px] font-black text-emerald-500 uppercase">Rapprochés</p>
            <p className="text-2xl font-black text-emerald-500">{stats.totalMatched}</p>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-[9px] font-black text-amber-500 uppercase">Partiels</p>
            <p className="text-2xl font-black text-amber-500">{stats.totalPartial}</p>
          </div>
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
            <p className="text-[9px] font-black text-rose-500 uppercase">Non rapprochés</p>
            <p className="text-2xl font-black text-rose-500">{stats.totalUnmatched}</p>
          </div>
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <p className="text-[9px] font-black text-purple-500 uppercase">Écart total</p>
            <p className="text-2xl font-black text-purple-500">{stats.totalDifference}€</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm w-64 focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm"
            >
              <option value="all">Tous statuts</option>
              <option value="matched">Rapprochés</option>
              <option value="partial">Partiels</option>
              <option value="unmatched">Non rapprochés</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--accent)]/10 transition-colors">
              <RefreshCw size={14} />
              Synchroniser
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">
              <FileText size={14} />
              Importer relevé
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--accent)]/10 transition-colors">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>

        {/* Reconciliation Table */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="p-4 text-left text-[10px] font-black uppercase">ID</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Date</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Réf. Banque</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Montant Banque</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Montant Système</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Écart</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Transactions</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Statut</th>
                  <th className="p-4 text-center text-[10px] font-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredReconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[var(--background)]/50 transition-colors">
                    <td className="p-4 text-sm font-mono">{rec.id}</td>
                    <td className="p-4 text-sm">{new Date(rec.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">{rec.bankRef}</td>
                    <td className="p-4 text-sm font-medium">{rec.bankAmount.toLocaleString()}€</td>
                    <td className="p-4 text-sm font-medium">{rec.systemAmount.toLocaleString()}€</td>
                    <td className={`p-4 text-sm font-bold ${rec.difference === 0 ? 'text-emerald-500' : rec.difference > 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {rec.difference === 0 ? '✓' : `${rec.difference > 0 ? '+' : ''}${rec.difference}€`}
                    </td>
                    <td className="p-4 text-sm">{rec.transactions}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black border ${getStatusColor(rec.status)}`}>
                        {getStatusIcon(rec.status)}
                        {getStatusText(rec.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                          <Eye size={14} className="text-[var(--foreground-muted)]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discrepancies Alert */}
        {stats.totalDifference > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium">Écarts détectés</p>
                <p className="text-[10px] text-[var(--foreground-muted)]">
                  Un écart total de {stats.totalDifference}€ a été détecté. Veuillez vérifier les transactions non rapprochées.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Payment Reconciliation • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Dernière synchro: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}