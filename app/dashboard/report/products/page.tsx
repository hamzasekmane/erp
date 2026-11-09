"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Award,
  Clock,
  Truck,
  ShoppingCart,
  Percent,
  Wallet,
  ChartNoAxesCombined,
  Box,
  Layers,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function ProductsReportPage() {
  const [period, setPeriod] = useState<string>("year");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Données produits
  const productsData = {
    total: 156,
    active: 142,
    outOfStock: 8,
    lowStock: 6,
    totalValue: 284500,
    avgPrice: 1823.72,
    turnover: 1245000,
    previousTurnover: 1120000,
    growth: 11.16
  };

  // Top produits
  const topProducts = [
    { id: "PRD-001", name: "ERP Professional", category: "Logiciel", price: 299, sold: 342, revenue: 102258, stock: 45, status: "active", rating: 4.8 },
    { id: "PRD-002", name: "Module RH", category: "Module", price: 99, sold: 256, revenue: 25344, stock: 78, status: "active", rating: 4.6 },
    { id: "PRD-003", name: "Module Comptabilité", category: "Module", price: 149, sold: 198, revenue: 29502, stock: 52, status: "active", rating: 4.7 },
    { id: "PRD-004", name: "Support Premium", category: "Service", price: 499, sold: 89, revenue: 44411, stock: -1, status: "service", rating: 4.9 },
    { id: "PRD-005", name: "Module CRM", category: "Module", price: 79, sold: 167, revenue: 13193, stock: 34, status: "active", rating: 4.5 },
    { id: "PRD-006", name: "Analytics Pro", category: "Logiciel", price: 199, sold: 134, revenue: 26666, stock: 23, status: "active", rating: 4.4 },
    { id: "PRD-007", name: "Module Projets", category: "Module", price: 89, sold: 98, revenue: 8722, stock: 12, status: "low", rating: 4.3 },
    { id: "PRD-008", name: "Module E-commerce", category: "Module", price: 129, sold: 76, revenue: 9804, stock: 8, status: "low", rating: 4.2 }
  ];

  // Ventes mensuelles
  const monthlySales = [
    { month: "Jan", revenue: 98500, units: 142, avgPrice: 694 },
    { month: "Fév", revenue: 102300, units: 156, avgPrice: 656 },
    { month: "Mar", revenue: 115600, units: 168, avgPrice: 688 },
    { month: "Avr", revenue: 121400, units: 175, avgPrice: 694 },
    { month: "Mai", revenue: 134200, units: 189, avgPrice: 710 },
    { month: "Juin", revenue: 142500, units: 198, avgPrice: 720 }
  ];

  // Répartition par catégorie
  const categoryDistribution = [
    { name: "Logiciel", revenue: 234500, percentage: 32.5, color: "bg-blue-500", products: 12 },
    { name: "Modules", revenue: 356800, percentage: 49.4, color: "bg-emerald-500", products: 48 },
    { name: "Services", revenue: 131200, percentage: 18.1, color: "bg-purple-500", products: 8 }
  ];

  // Performance par catégorie
  const categoryPerformance = [
    { name: "Logiciel", growth: 15.2, margin: 68, bestSeller: "ERP Professional" },
    { name: "Modules", growth: 22.8, margin: 72, bestSeller: "Module RH" },
    { name: "Services", growth: 8.5, margin: 85, bestSeller: "Support Premium" }
  ];

  const getMaxRevenue = (): number => Math.max(...monthlySales.map(d => d.revenue));
  const getMaxUnits = (): number => Math.max(...monthlySales.map(d => d.units));

  const getStatusColor = (status: string): string => {
    switch(status) {
      case "active": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "low": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "out": return "bg-red-500/10 text-red-500 border-red-500/30";
      case "service": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getStatusText = (status: string): string => {
    switch(status) {
      case "active": return "En stock";
      case "low": return "Stock faible";
      case "out": return "Rupture";
      case "service": return "Service";
      default: return status.toUpperCase();
    }
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={10}
            className={i < fullStars ? "text-amber-500 fill-amber-500" : (i === fullStars && hasHalfStar ? "text-amber-500 fill-amber-500/50" : "text-gray-500")}
          />
        ))}
        <span className="text-[9px] text-[var(--foreground-muted)] ml-1">{rating}</span>
      </div>
    );
  };

  const filteredProducts = topProducts.filter(product => {
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

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
              <Package size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • PRODUCTS
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● REPORT
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapport <span className="text-[var(--accent)]">Produits</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Analyse des ventes et performance produits
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
                <Package size={16} className="text-[var(--accent)]" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_01</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Total Produits</p>
            <p className="text-2xl font-black text-[var(--foreground)]">{productsData.total}</p>
            <div className="flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">{productsData.active} actifs</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[91%] h-full bg-[var(--accent)] rounded-full" />
            </div>
          </div>

          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <DollarSign size={16} className="text-emerald-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_02</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Chiffre d'affaires</p>
            <p className="text-2xl font-black text-emerald-500">{productsData.turnover.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+{productsData.growth}%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[88%] h-full bg-emerald-500 rounded-full" />
            </div>
          </div>

          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-purple-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <ShoppingCart size={16} className="text-purple-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_03</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Valeur stock</p>
            <p className="text-2xl font-black text-purple-500">{productsData.totalValue.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-purple-500">{productsData.outOfStock} ruptures</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[45%] h-full bg-purple-500 rounded-full" />
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
                <Percent size={16} className="text-[var(--accent)]" />
              </div>
              <span className="text-[8px] font-mono text-[var(--accent)]">LIVE</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Prix moyen</p>
            <p className="text-2xl font-black text-[var(--accent)]">{productsData.avgPrice.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+5.2%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[60%] h-full bg-[var(--accent)] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* SALES CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Evolution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <BarChart3 size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Évolution du CA</h3>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span>CA (€)</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,${200 - (monthlySales[0].revenue / getMaxRevenue() * 180)} 
                       L ${500/6},${200 - (monthlySales[1].revenue / getMaxRevenue() * 180)} 
                       L ${1000/6},${200 - (monthlySales[2].revenue / getMaxRevenue() * 180)} 
                       L ${1500/6},${200 - (monthlySales[3].revenue / getMaxRevenue() * 180)} 
                       L ${2000/6},${200 - (monthlySales[4].revenue / getMaxRevenue() * 180)} 
                       L ${2500/6},${200 - (monthlySales[5].revenue / getMaxRevenue() * 180)} 
                       L 500,200 L 0,200 Z`}
                  fill="url(#revenueGradient)"
                />
                <polyline
                  points={monthlySales.map((d, i) => 
                    `${i * (500/6)},${200 - (d.revenue / getMaxRevenue() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                {monthlySales.map((d, i) => (
                  <circle
                    key={i}
                    cx={i * (500/6)}
                    cy={200 - (d.revenue / getMaxRevenue() * 180)}
                    r="3"
                    fill="#10b981"
                  />
                ))}
              </svg>
            </div>
            
            <div className="flex justify-between mt-4">
              {monthlySales.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d.month}</p>
                  <p className="text-[9px] font-bold text-emerald-500">{Math.round(d.revenue / 1000)}k€</p>
                </div>
              ))}
            </div>
          </div>

          {/* Units Sold Chart */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <Activity size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Unités vendues</h3>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Quantité</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {monthlySales.map((d, i) => {
                  const height = (d.units / getMaxUnits()) * 180;
                  const x = i * (500/6) + 20;
                  const width = 40;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={200 - height}
                      width={width}
                      height={height}
                      fill="#8b5cf6"
                      opacity="0.7"
                      rx="4"
                    >
                      <title>{d.units} unités</title>
                    </rect>
                  );
                })}
              </svg>
            </div>
            
            <div className="flex justify-between mt-4">
              {monthlySales.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d.month}</p>
                  <p className="text-[9px] font-bold text-purple-500">{d.units}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CATEGORY PERFORMANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Revenue Distribution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <PieChart size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Répartition du CA par catégorie</h3>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeDasharray={`${(categoryDistribution[0].revenue / productsData.turnover) * 283} 283`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${(categoryDistribution[1].revenue / productsData.turnover) * 283} 283`}
                    strokeDashoffset={`-${(categoryDistribution[0].revenue / productsData.turnover) * 283}`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="10"
                    strokeDasharray={`${(categoryDistribution[2].revenue / productsData.turnover) * 283} 283`}
                    strokeDashoffset={`-${((categoryDistribution[0].revenue + categoryDistribution[1].revenue) / productsData.turnover) * 283}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
            </div>
            
            <div className="space-y-3">
              {categoryDistribution.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${cat.color} rounded-full`} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="text-[var(--foreground-muted)]">{cat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mt-1">
                    <span>{cat.products} produits</span>
                    <span>{Math.round(cat.revenue / 1000)}k€ CA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance Metrics */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <TrendingUp size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Performance par catégorie</h3>
            </div>
            
            <div className="space-y-4">
              {categoryPerformance.map((cat) => (
                <div key={cat.name} className="p-4 bg-[var(--background)]/50 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-black">{cat.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">Meilleure vente: {cat.bestSeller}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {cat.growth > 0 ? (
                          <ArrowUpRight size={12} className="text-emerald-500" />
                        ) : (
                          <ArrowDownRight size={12} className="text-red-500" />
                        )}
                        <span className={`text-xs font-bold ${cat.growth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          +{cat.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-[var(--foreground-muted)]">Marge</p>
                      <p className="text-sm font-bold">{cat.margin}%</p>
                      <div className="w-full h-1 bg-[var(--border)] rounded-full mt-1 overflow-hidden">
                        <div className={`w-[${cat.margin}%] h-full bg-emerald-500 rounded-full`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--foreground-muted)]">Croissance</p>
                      <p className="text-sm font-bold text-emerald-500">+{cat.growth}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                  <Box size={16} className="text-[var(--accent)]" />
                </div>
                <h2 className="text-lg font-black">Top Produits</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm w-64 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm"
                >
                  <option value="all">Toutes catégories</option>
                  <option value="Logiciel">Logiciel</option>
                  <option value="Module">Modules</option>
                  <option value="Service">Services</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Produit</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Catégorie</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Prix</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Vendus</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">CA</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Stock</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Note</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Statut</th>
                  <th className="p-4 text-center text-[10px] font-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[var(--background)]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl flex items-center justify-center font-black text-[var(--accent)]">
                          {product.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{product.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">{product.price}€</span>
                    </td>
                    <td className="p-4 text-sm">{product.sold}</td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-emerald-500">{product.revenue.toLocaleString()}€</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm ${product.stock < 0 ? 'text-purple-500' : product.stock < 10 ? 'text-amber-500' : 'text-[var(--foreground)]'}`}>
                        {product.stock < 0 ? 'Illimité' : product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      {getRatingStars(product.rating)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black border ${getStatusColor(product.status)}`}>
                        {product.status === "active" && <CheckCircle size={10} />}
                        {product.status === "low" && <AlertCircle size={10} />}
                        {product.status === "out" && <XCircle size={10} />}
                        {getStatusText(product.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                          <Eye size={14} className="text-[var(--foreground-muted)]" />
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

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="p-5 border-t border-[var(--border)] flex justify-between items-center">
              <p className="text-[10px] text-[var(--foreground-muted)]">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} produits
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

        {/* STOCK ALERTS */}
        {(productsData.lowStock > 0 || productsData.outOfStock > 0) && (
          <div className={`p-4 rounded-xl flex items-center justify-between flex-wrap gap-4 ${
            productsData.outOfStock > 0 
              ? 'bg-red-500/10 border border-red-500/30' 
              : 'bg-amber-500/10 border border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {productsData.outOfStock > 0 ? (
                <XCircle size={20} className="text-red-500" />
              ) : (
                <AlertCircle size={20} className="text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {productsData.outOfStock > 0 
                    ? `${productsData.outOfStock} produit(s) en rupture de stock` 
                    : `${productsData.lowStock} produit(s) avec stock faible`}
                </p>
                <p className="text-[10px] text-[var(--foreground-muted)]">
                  Pensez à réapprovisionner ces produits pour éviter les ruptures
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">
              Voir les alertes
            </button>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Products Report • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Données produits en temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}