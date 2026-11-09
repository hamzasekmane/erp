"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  Mail,
  Phone,
  MapPin,
  Building2,
  Star,
  Award,
  Crown,
  Clock,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Shield,
  Heart,
  ThumbsUp,
  MessageCircle,
  FileText,
  Receipt,
  CreditCard
} from "lucide-react";

export default function ClientsReportPage() {
  const [period, setPeriod] = useState<string>("year");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Données clients
  const clientsData = {
    total: 284,
    new: 42,
    active: 238,
    inactive: 46,
    churned: 28,
    retentionRate: 89.4,
    avgLTV: 2450,
    avgRevenue: 12450
  };

  // Top clients
  const topClients = [
    { id: "CLT-001", name: "TechCorp Solutions", email: "contact@techcorp.com", revenue: 28500, subscriptions: 3, status: "active", tier: "platinum", since: "2022-01-15" },
    { id: "CLT-002", name: "Innovation Labs", email: "admin@innovationlabs.com", revenue: 18900, subscriptions: 2, status: "active", tier: "gold", since: "2022-06-20" },
    { id: "CLT-003", name: "Digital Solutions", email: "info@digitalsolutions.com", revenue: 12450, subscriptions: 2, status: "active", tier: "silver", since: "2023-02-10" },
    { id: "CLT-004", name: "Cloud Systems", email: "sales@cloudsystems.com", revenue: 8900, subscriptions: 1, status: "active", tier: "silver", since: "2023-05-18" },
    { id: "CLT-005", name: "Data Analytics Pro", email: "contact@dataanalytics.com", revenue: 7500, subscriptions: 1, status: "inactive", tier: "bronze", since: "2023-08-22" }
  ];

  // Acquisition par mois
  const monthlyAcquisition = [
    { month: "Jan", new: 18, active: 145, churned: 3 },
    { month: "Fév", new: 22, active: 152, churned: 4 },
    { month: "Mar", new: 25, active: 168, churned: 2 },
    { month: "Avr", new: 20, active: 182, churned: 5 },
    { month: "Mai", new: 28, active: 198, churned: 3 },
    { month: "Juin", new: 35, active: 225, churned: 4 }
  ];

  // Répartition par secteur
  const industryDistribution = [
    { name: "Technologie", count: 98, percentage: 34.5, color: "bg-blue-500" },
    { name: "Finance", count: 52, percentage: 18.3, color: "bg-emerald-500" },
    { name: "Santé", count: 38, percentage: 13.4, color: "bg-purple-500" },
    { name: "Commerce", count: 45, percentage: 15.8, color: "bg-amber-500" },
    { name: "Autres", count: 51, percentage: 18.0, color: "bg-gray-500" }
  ];

  // Répartition par taille
  const sizeDistribution = [
    { name: "Startup (1-10)", count: 86, percentage: 30.3 },
    { name: "PME (11-50)", count: 112, percentage: 39.4 },
    { name: "ETI (51-200)", count: 54, percentage: 19.0 },
    { name: "Grande Entreprise (200+)", count: 32, percentage: 11.3 }
  ];

  const getTierColor = (tier: string): string => {
    switch(tier) {
      case "platinum": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "gold": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "silver": return "bg-gray-400/10 text-gray-400 border-gray-400/30";
      case "bronze": return "bg-amber-600/10 text-amber-600 border-amber-600/30";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getTierIcon = (tier: string) => {
    switch(tier) {
      case "platinum": return <Crown size={12} />;
      case "gold": return <Award size={12} />;
      case "silver": return <Star size={12} />;
      case "bronze": return <Target size={12} />;
      default: return <Users size={12} />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch(status) {
      case "active": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "inactive": return "bg-rose-500/10 text-rose-500 border-rose-500/30";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getMaxValue = (): number => Math.max(...monthlyAcquisition.map(d => d.active));

  const filteredClients = topClients.filter(client => {
    const matchesSearch = searchTerm === "" || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/report"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <Users size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • CLIENTS
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● REPORT
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapport <span className="text-[var(--accent)]">Clients</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Analyse détaillée de votre portefeuille clients
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-1">
              {["month", "quarter", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    period === p 
                      ? 'bg-[var(--accent)] text-white' 
                      : 'hover:bg-[var(--accent)]/10'
                  }`}
                >
                  {p === "month" ? "Mois" : p === "quarter" ? "Trimestre" : "Année"}
                </button>
              ))}
            </div>
            <select className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm">
              <option>2024</option>
              <option>2023</option>
              <option>2022</option>
            </select>
            <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
              <RefreshCw size={16} className="text-[var(--foreground-muted)]" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--accent)]/10 transition-colors">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
                <Users size={16} className="text-[var(--accent)]" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_01</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Total Clients</p>
            <p className="text-2xl font-black text-[var(--foreground)]">{clientsData.total}</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+{clientsData.new}</span>
              <span className="text-[9px] text-[var(--foreground-muted)]">nouveaux</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[84%] h-full bg-[var(--accent)] rounded-full" />
            </div>
          </div>

          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <UserCheck size={16} className="text-emerald-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_02</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Clients Actifs</p>
            <p className="text-2xl font-black text-emerald-500">{clientsData.active}</p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-emerald-500">{Math.round((clientsData.active / clientsData.total) * 100)}%</span>
              <span className="text-[9px] text-[var(--foreground-muted)]">du total</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[84%] h-full bg-emerald-500 rounded-full" />
            </div>
          </div>

          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-purple-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <DollarSign size={16} className="text-purple-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_03</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">LTV Moyenne</p>
            <p className="text-2xl font-black text-purple-500">{clientsData.avgLTV}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+12%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[65%] h-full bg-purple-500 rounded-full" />
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
                <Heart size={16} className="text-[var(--accent)]" />
              </div>
              <span className="text-[8px] font-mono text-[var(--accent)]">LIVE</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Taux de Fidélisation</p>
            <p className="text-2xl font-black text-[var(--accent)]">{clientsData.retentionRate}%</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+5.2%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[89%] h-full bg-[var(--accent)] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* CLIENT ACQUISITION CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Acquisition Evolution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <BarChart3 size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Acquisition clients</h3>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span>Nouveaux</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Actifs</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* New Clients Area */}
                <path
                  d={`M 0,${200 - (monthlyAcquisition[0].new / getMaxValue() * 180)} 
                       L ${500/6},${200 - (monthlyAcquisition[1].new / getMaxValue() * 180)} 
                       L ${1000/6},${200 - (monthlyAcquisition[2].new / getMaxValue() * 180)} 
                       L ${1500/6},${200 - (monthlyAcquisition[3].new / getMaxValue() * 180)} 
                       L ${2000/6},${200 - (monthlyAcquisition[4].new / getMaxValue() * 180)} 
                       L ${2500/6},${200 - (monthlyAcquisition[5].new / getMaxValue() * 180)} 
                       L 500,200 L 0,200 Z`}
                  fill="url(#newGradient)"
                />
                {/* New Clients Line */}
                <polyline
                  points={monthlyAcquisition.map((d, i) => 
                    `${i * (500/6)},${200 - (d.new / getMaxValue() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                {/* Active Clients Line */}
                <polyline
                  points={monthlyAcquisition.map((d, i) => 
                    `${i * (500/6)},${200 - (d.active / getMaxValue() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                {/* Points for active clients */}
                {monthlyAcquisition.map((d, i) => (
                  <circle
                    key={i}
                    cx={i * (500/6)}
                    cy={200 - (d.active / getMaxValue() * 180)}
                    r="3"
                    fill="#8b5cf6"
                  />
                ))}
              </svg>
            </div>
            
            <div className="flex justify-between mt-4">
              {monthlyAcquisition.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d.month}</p>
                  <p className="text-[9px] font-bold text-emerald-500">+{d.new}</p>
                  <p className="text-[8px] text-purple-500">{d.active}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Distribution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <PieChart size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Répartition par secteur</h3>
            </div>
            
            <div className="space-y-4">
              {industryDistribution.map((industry) => (
                <div key={industry.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{industry.name}</span>
                    <span className="text-[var(--foreground-muted)]">{industry.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${industry.color} rounded-full`}
                      style={{ width: `${industry.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mt-1">
                    <span>{industry.count} clients</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIZE DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Company Size Distribution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <Building2 size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Répartition par taille</h3>
            </div>
            
            <div className="space-y-4">
              {sizeDistribution.map((size) => (
                <div key={size.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{size.name}</span>
                    <span className="text-[var(--foreground-muted)]">{size.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${size.percentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[var(--foreground-muted)] mt-1">
                    {size.count} clients
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Churn Analysis */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                <UserX size={14} className="text-rose-500" />
              </div>
              <h3 className="font-black">Analyse du Churn</h3>
            </div>
            
            <div className="text-center mb-6">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeDasharray={`${(clientsData.churned / clientsData.total) * 283} 283`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <p className="text-2xl font-black text-rose-500">{clientsData.churned}</p>
                    <p className="text-[8px] text-[var(--foreground-muted)]">résiliés</p>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium mt-4">Taux de churn: {Math.round((clientsData.churned / clientsData.total) * 100)}%</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-emerald-500/5 rounded-xl text-center">
                <p className="text-[10px] text-[var(--foreground-muted)]">Taux rétention</p>
                <p className="text-xl font-black text-emerald-500">{clientsData.retentionRate}%</p>
              </div>
              <div className="p-3 bg-purple-500/5 rounded-xl text-center">
                <p className="text-[10px] text-[var(--foreground-muted)]">CA par client</p>
                <p className="text-xl font-black text-purple-500">{Math.round(clientsData.avgRevenue)}€</p>
              </div>
            </div>
          </div>
        </div>

        {/* TOP CLIENTS TABLE */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                  <Award size={16} className="text-[var(--accent)]" />
                </div>
                <h2 className="text-lg font-black">Top Clients</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
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
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Client</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Email</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">CA généré</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Abonnements</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Client depuis</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Niveau</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Statut</th>
                  <th className="p-4 text-center text-[10px] font-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-[var(--background)]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl flex items-center justify-center font-black text-[var(--accent)]">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">{client.email}</td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-emerald-500">{client.revenue.toLocaleString()}€</span>
                    </td>
                    <td className="p-4 text-sm">{client.subscriptions}</td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">
                      {new Date(client.since).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black border ${getTierColor(client.tier)}`}>
                        {getTierIcon(client.tier)}
                        {client.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black border ${getStatusColor(client.status)}`}>
                        {client.status === "active" ? "ACTIF" : "INACTIF"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                          <Eye size={14} className="text-[var(--foreground-muted)]" />
                        </button>
                        <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                          <MessageCircle size={14} className="text-[var(--foreground-muted)]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredClients.length > 0 && (
            <div className="p-5 border-t border-[var(--border)] flex justify-between items-center">
              <p className="text-[10px] text-[var(--foreground-muted)]">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredClients.length)} sur {filteredClients.length} clients
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

        {/* CLIENT SATISFACTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ThumbsUp size={16} className="text-emerald-500" />
              </div>
              <span className="text-sm font-black">Satisfaction client</span>
            </div>
            <p className="text-2xl font-black">4.8/5</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Basé sur 156 avis</p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
              <div className="w-[96%] h-full bg-emerald-500 rounded-full" />
            </div>
          </div>

          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock size={16} className="text-blue-500" />
              </div>
              <span className="text-sm font-black">Temps moyen support</span>
            </div>
            <p className="text-2xl font-black">2.4h</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Délai de résolution</p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
              <div className="w-[85%] h-full bg-blue-500 rounded-full" />
            </div>
          </div>

          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Activity size={16} className="text-purple-500" />
              </div>
              <span className="text-sm font-black">Taux d'engagement</span>
            </div>
            <p className="text-2xl font-black">76%</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Utilisateurs actifs quotidiens</p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
              <div className="w-[76%] h-full bg-purple-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Clients Report • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Données clients en temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}