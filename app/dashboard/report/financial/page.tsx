"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  CreditCard,
  Receipt,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Printer,
  Mail,
  Share2,
  Building2,
  Wallet,
  PiggyBank,
  Landmark,
  ChartNoAxesCombined,
  Percent,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function FinancialReportPage() {
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState("2024");
  const [reportType, setReportType] = useState("all");

  // Données financières
  const financialData = {
    revenue: {
      total: 124500,
      previous: 112000,
      growth: 11.16,
      breakdown: {
        subscriptions: 98500,
        oneTime: 16000,
        addons: 10000
      }
    },
    expenses: {
      total: 45200,
      previous: 43800,
      growth: 3.2,
      breakdown: {
        salaries: 25000,
        infrastructure: 12000,
        marketing: 5200,
        other: 3000
      }
    },
    profit: {
      total: 79300,
      previous: 68200,
      growth: 16.28,
      margin: 63.7
    },
    cashFlow: {
      operating: 85000,
      investing: -15000,
      financing: -5000,
      net: 65000
    }
  };

  // Revenus mensuels
  const monthlyRevenue = [
    { month: "Jan", revenue: 9800, expenses: 4100, profit: 5700 },
    { month: "Fév", revenue: 10200, expenses: 4200, profit: 6000 },
    { month: "Mar", revenue: 10800, expenses: 4300, profit: 6500 },
    { month: "Avr", revenue: 11500, expenses: 4400, profit: 7100 },
    { month: "Mai", revenue: 12100, expenses: 4500, profit: 7600 },
    { month: "Juin", revenue: 12450, expenses: 4520, profit: 7930 }
  ];

  // Factures récentes
  const recentInvoices = [
    { id: "INV-2024-001", customer: "TechCorp", amount: 990, date: "2024-01-20", status: "paid", type: "subscription" },
    { id: "INV-2024-002", customer: "Innovation Labs", amount: 2490, date: "2024-01-19", status: "paid", type: "subscription" },
    { id: "INV-2024-003", customer: "Digital Solutions", amount: 990, date: "2024-01-18", status: "pending", type: "subscription" },
    { id: "INV-2024-004", customer: "Startup Hub", amount: 490, date: "2024-01-17", status: "paid", type: "one-time" },
    { id: "INV-2024-005", customer: "Cloud Systems", amount: 1990, date: "2024-01-16", status: "paid", type: "subscription" }
  ];

  // Transactions récentes
  const recentTransactions = [
    { id: "TXN-001", description: "Paiement Stripe", amount: 990, date: "2024-01-20", type: "income", method: "Carte Visa" },
    { id: "TXN-002", description: "AWS Infrastructure", amount: -1250, date: "2024-01-19", type: "expense", method: "Virement" },
    { id: "TXN-003", description: "Paiement client", amount: 2490, date: "2024-01-18", type: "income", method: "Carte Mastercard" },
    { id: "TXN-004", description: "Marketing Google Ads", amount: -850, date: "2024-01-17", type: "expense", method: "Carte Visa" },
    { id: "TXN-005", description: "Salaire équipe", amount: -12500, date: "2024-01-15", type: "expense", method: "Virement" }
  ];

  const getMaxRevenue = () => Math.max(...monthlyRevenue.map(d => d.revenue));
  const getMaxExpenses = () => Math.max(...monthlyRevenue.map(d => d.expenses));

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
              <DollarSign size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • FINANCIAL
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● REPORT
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapport <span className="text-[var(--accent)]">Financier</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Analyse complète de la santé financière de votre entreprise
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
            <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
              <Printer size={16} className="text-[var(--foreground-muted)]" />
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_01</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Chiffre d'affaires</p>
            <p className="text-2xl font-black text-emerald-500">{financialData.revenue.total.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+{financialData.revenue.growth}%</span>
              <span className="text-[9px] text-[var(--foreground-muted)]">vs période précédente</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
            </div>
          </div>

          {/* Expenses */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-rose-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingDown size={16} className="text-rose-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_02</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Dépenses</p>
            <p className="text-2xl font-black text-rose-500">{financialData.expenses.total.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-rose-500" />
              <span className="text-[10px] font-medium text-rose-500">+{financialData.expenses.growth}%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[45%] h-full bg-rose-500 rounded-full" />
            </div>
          </div>

          {/* Profit */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <Wallet size={16} className="text-purple-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_03</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Bénéfice net</p>
            <p className="text-2xl font-black text-purple-500">{financialData.profit.total.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+{financialData.profit.growth}%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[63%] h-full bg-purple-500 rounded-full" />
            </div>
          </div>

          {/* Margin */}
          <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
                <Percent size={16} className="text-[var(--accent)]" />
              </div>
              <span className="text-[8px] font-mono text-[var(--accent)]">LIVE</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Marge bénéficiaire</p>
            <p className="text-2xl font-black text-[var(--accent)]">{financialData.profit.margin}%</p>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-emerald-500">Excellent</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[63%] h-full bg-[var(--accent)] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue vs Expenses Chart */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <LineChart size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Évolution CA vs Dépenses</h3>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span>CA</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <span>Dépenses</span>
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
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Revenue Area */}
                <path
                  d={`M 0,${200 - (monthlyRevenue[0].revenue / getMaxRevenue() * 180)} 
                       L ${500/6},${200 - (monthlyRevenue[1].revenue / getMaxRevenue() * 180)} 
                       L ${1000/6},${200 - (monthlyRevenue[2].revenue / getMaxRevenue() * 180)} 
                       L ${1500/6},${200 - (monthlyRevenue[3].revenue / getMaxRevenue() * 180)} 
                       L ${2000/6},${200 - (monthlyRevenue[4].revenue / getMaxRevenue() * 180)} 
                       L ${2500/6},${200 - (monthlyRevenue[5].revenue / getMaxRevenue() * 180)} 
                       L 500,200 L 0,200 Z`}
                  fill="url(#revenueGradient)"
                />
                {/* Expenses Area */}
                <path
                  d={`M 0,${200 - (monthlyRevenue[0].expenses / getMaxExpenses() * 180)} 
                       L ${500/6},${200 - (monthlyRevenue[1].expenses / getMaxExpenses() * 180)} 
                       L ${1000/6},${200 - (monthlyRevenue[2].expenses / getMaxExpenses() * 180)} 
                       L ${1500/6},${200 - (monthlyRevenue[3].expenses / getMaxExpenses() * 180)} 
                       L ${2000/6},${200 - (monthlyRevenue[4].expenses / getMaxExpenses() * 180)} 
                       L ${2500/6},${200 - (monthlyRevenue[5].expenses / getMaxExpenses() * 180)} 
                       L 500,200 L 0,200 Z`}
                  fill="url(#expensesGradient)"
                />
                {/* Revenue Line */}
                <polyline
                  points={monthlyRevenue.map((d, i) => 
                    `${i * (500/6)},${200 - (d.revenue / getMaxRevenue() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                {/* Expenses Line */}
                <polyline
                  points={monthlyRevenue.map((d, i) => 
                    `${i * (500/6)},${200 - (d.expenses / getMaxExpenses() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
              </svg>
            </div>
            
            <div className="flex justify-between mt-4">
              {monthlyRevenue.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d.month}</p>
                  <p className="text-[9px] font-bold text-emerald-500">{d.revenue}€</p>
                  <p className="text-[8px] text-rose-500">{d.expenses}€</p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <PieChart size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Répartition du CA</h3>
            </div>
            
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${(financialData.revenue.breakdown.subscriptions / financialData.revenue.total) * 283} 283`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeDasharray={`${(financialData.revenue.breakdown.oneTime / financialData.revenue.total) * 283} 283`}
                    strokeDashoffset={`-${(financialData.revenue.breakdown.subscriptions / financialData.revenue.total) * 283}`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="10"
                    strokeDasharray={`${(financialData.revenue.breakdown.addons / financialData.revenue.total) * 283} 283`}
                    strokeDashoffset={`-${((financialData.revenue.breakdown.subscriptions + financialData.revenue.breakdown.oneTime) / financialData.revenue.total) * 283}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black">{financialData.revenue.total.toLocaleString()}€</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Abonnements</span>
                </div>
                <span className="text-sm font-medium">{financialData.revenue.breakdown.subscriptions.toLocaleString()}€</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round((financialData.revenue.breakdown.subscriptions / financialData.revenue.total) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm">Paiements uniques</span>
                </div>
                <span className="text-sm font-medium">{financialData.revenue.breakdown.oneTime.toLocaleString()}€</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round((financialData.revenue.breakdown.oneTime / financialData.revenue.total) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-sm">Modules additionnels</span>
                </div>
                <span className="text-sm font-medium">{financialData.revenue.breakdown.addons.toLocaleString()}€</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round((financialData.revenue.breakdown.addons / financialData.revenue.total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CASH FLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Landmark size={14} className="text-blue-500" />
              </div>
              <h3 className="font-black">Flux de trésorerie</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-emerald-500/5 rounded-xl">
                <div>
                  <p className="text-xs font-medium">Flux d'exploitation</p>
                  <p className="text-[9px] text-[var(--foreground-muted)]">Activités opérationnelles</p>
                </div>
                <p className="text-lg font-black text-emerald-500">+{financialData.cashFlow.operating.toLocaleString()}€</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-rose-500/5 rounded-xl">
                <div>
                  <p className="text-xs font-medium">Flux d'investissement</p>
                  <p className="text-[9px] text-[var(--foreground-muted)]">Investissements</p>
                </div>
                <p className="text-lg font-black text-rose-500">{financialData.cashFlow.investing.toLocaleString()}€</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-amber-500/5 rounded-xl">
                <div>
                  <p className="text-xs font-medium">Flux de financement</p>
                  <p className="text-[9px] text-[var(--foreground-muted)]">Financement</p>
                </div>
                <p className="text-lg font-black text-amber-500">{financialData.cashFlow.financing.toLocaleString()}€</p>
              </div>
              
              <div className="border-t border-[var(--border)] pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-black">Variation de trésorerie</p>
                  <p className="text-xl font-black text-[var(--accent)]">+{financialData.cashFlow.net.toLocaleString()}€</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                <PiggyBank size={14} className="text-rose-500" />
              </div>
              <h3 className="font-black">Détail des dépenses</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(financialData.expenses.breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{key === "salaries" ? "Salaires" : key === "infrastructure" ? "Infrastructure" : key === "marketing" ? "Marketing" : "Autres"}</span>
                    <span className="text-[var(--foreground-muted)]">{Math.round((value / financialData.expenses.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${(value / financialData.expenses.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-1">{value.toLocaleString()}€</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT INVOICES & TRANSACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Invoices */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                    <Receipt size={16} className="text-[var(--accent)]" />
                  </div>
                  <h2 className="text-lg font-black">Factures récentes</h2>
                </div>
                <Link href="/dashboard/invoices" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                  Voir tout
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-[var(--border)]">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-[var(--background)]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{invoice.id}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{invoice.customer}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">{invoice.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{invoice.amount}€</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black ${
                        invoice.status === 'paid' 
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {invoice.status === 'paid' ? <CheckCircle size={8} /> : <Clock size={8} />}
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                    <CreditCard size={16} className="text-[var(--accent)]" />
                  </div>
                  <h2 className="text-lg font-black">Transactions récentes</h2>
                </div>
                <Link href="/dashboard/transactions" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                  Voir tout
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-[var(--border)]">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-[var(--background)]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">{transaction.date} • {transaction.method}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {transaction.type === 'income' ? '+' : ''}{transaction.amount}€
                      </p>
                      <p className="text-[8px] text-[var(--foreground-muted)]">{transaction.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Financial Report • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Données certifiées • Audit financier
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}