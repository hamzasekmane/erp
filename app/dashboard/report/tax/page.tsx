"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Receipt,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Printer,
  Mail,
  Building2,
  Landmark,
  Calculator,
  Percent,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  FileCheck,
  AlertTriangle,
  Shield
} from "lucide-react";

export default function TaxReportPage() {
  const [period, setPeriod] = useState<string>("quarter");
  const [year, setYear] = useState<string>("2024");
  const [taxType, setTaxType] = useState<string>("all");

  // Données fiscales
  const taxData = {
    vat: {
      collected: 24800,
      previousCollected: 22400,
      paid: 12400,
      previousPaid: 11200,
      net: 12400,
      previousNet: 11200,
      rate: 20
    },
    corporateTax: {
      amount: 18900,
      previousAmount: 16200,
      rate: 25,
      taxableIncome: 75600
    },
    otherTaxes: {
      payroll: 5200,
      property: 1200,
      other: 800,
      total: 7200
    }
  };

  // Déclarations fiscales
  const taxDeclarations = [
    { id: "TVA-2024-Q1", type: "TVA", period: "T1 2024", dueDate: "2024-04-15", status: "paid", amount: 6200, filedDate: "2024-04-10" },
    { id: "TVA-2023-Q4", type: "TVA", period: "T4 2023", dueDate: "2024-01-15", status: "paid", amount: 5800, filedDate: "2024-01-12" },
    { id: "IS-2023", type: "IS", period: "2023", dueDate: "2024-04-30", status: "pending", amount: 18900, filedDate: null },
    { id: "TVA-2023-Q3", type: "TVA", period: "T3 2023", dueDate: "2023-10-15", status: "paid", amount: 5600, filedDate: "2023-10-10" },
    { id: "DS-2023", type: "DS", period: "2023", dueDate: "2024-01-31", status: "paid", amount: 5200, filedDate: "2024-01-28" }
  ];

  // Transactions par mois
  const monthlyTaxData = [
    { month: "Jan", collected: 4100, paid: 2050, net: 2050 },
    { month: "Fév", collected: 4300, paid: 2150, net: 2150 },
    { month: "Mar", collected: 4600, paid: 2300, net: 2300 },
    { month: "Avr", collected: 4800, paid: 2400, net: 2400 },
    { month: "Mai", collected: 5100, paid: 2550, net: 2550 },
    { month: "Juin", collected: 5400, paid: 2700, net: 2700 }
  ];

  // Factures avec TVA
  const invoicesWithTax = [
    { id: "INV-2024-001", customer: "TechCorp Solutions", amount: 990, vat: 198, total: 1188, date: "2024-01-20", status: "paid" },
    { id: "INV-2024-002", customer: "Innovation Labs", amount: 2490, vat: 498, total: 2988, date: "2024-01-19", status: "paid" },
    { id: "INV-2024-003", customer: "Digital Solutions", amount: 990, vat: 198, total: 1188, date: "2024-01-18", status: "pending" },
    { id: "INV-2024-004", customer: "Startup Hub", amount: 490, vat: 98, total: 588, date: "2024-01-17", status: "paid" },
    { id: "INV-2024-005", customer: "Cloud Systems", amount: 1990, vat: 398, total: 2388, date: "2024-01-16", status: "paid" }
  ];

  const getMaxValue = (): number => Math.max(...monthlyTaxData.map(d => d.collected));

  const getStatusColor = (status: string): string => {
    switch(status) {
      case "paid": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "overdue": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getStatusText = (status: string): string => {
    switch(status) {
      case "paid": return "Déclarée";
      case "pending": return "En attente";
      case "overdue": return "En retard";
      default: return status.toUpperCase();
    }
  };

  const getTaxTypeName = (type: string): string => {
    switch(type) {
      case "TVA": return "TVA";
      case "IS": return "Impôt sur les Sociétés";
      case "DS": return "Déclaration Sociale";
      default: return type;
    }
  };

  const totalTaxes = taxData.vat.net + taxData.corporateTax.amount + taxData.otherTaxes.total;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
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
              <Calculator size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • TAX
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● REPORT
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapport <span className="text-[var(--accent)]">Fiscal</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gestion et suivi des obligations fiscales
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-1">
              {["quarter", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    period === p 
                      ? 'bg-[var(--accent)] text-white' 
                      : 'hover:bg-[var(--accent)]/10'
                  }`}
                >
                  {p === "quarter" ? "Trimestre" : "Année"}
                </button>
              ))}
            </div>
            <select 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
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
          {/* TVA Collectée */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_01</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">TVA Collectée</p>
            <p className="text-2xl font-black text-emerald-500">{taxData.vat.collected.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+10.7%</span>
              <span className="text-[9px] text-[var(--foreground-muted)]">vs période préc.</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[75%] h-full bg-emerald-500 rounded-full" />
            </div>
          </div>

          {/* TVA Déductible */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-rose-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingDown size={16} className="text-rose-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_02</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">TVA Déductible</p>
            <p className="text-2xl font-black text-rose-500">{taxData.vat.paid.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-rose-500" />
              <span className="text-[10px] font-medium text-rose-500">+10.7%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[50%] h-full bg-rose-500 rounded-full" />
            </div>
          </div>

          {/* TVA Nette */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <Wallet size={16} className="text-purple-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_03</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">TVA Nette à Payer</p>
            <p className="text-2xl font-black text-purple-500">{taxData.vat.net.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-purple-500" />
              <span className="text-[10px] font-medium text-purple-500">+10.7%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[50%] h-full bg-purple-500 rounded-full" />
            </div>
          </div>

          {/* Impôt sur les Sociétés */}
          <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
                <Landmark size={16} className="text-[var(--accent)]" />
              </div>
              <span className="text-[8px] font-mono text-[var(--accent)]">LIVE</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Impôt sur les Sociétés</p>
            <p className="text-2xl font-black text-[var(--accent)]">{taxData.corporateTax.amount.toLocaleString()}€</p>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-emerald-500">Taux {taxData.corporateTax.rate}%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[25%] h-full bg-[var(--accent)] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* TAX BREAKDOWN CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* VAT Monthly Evolution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <BarChart3 size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Évolution mensuelle TVA</h3>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span>Collectée</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <span>Déductible</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Collected Area */}
                <path
                  d={`M 0,${200 - (monthlyTaxData[0].collected / getMaxValue() * 180)} 
                       L ${500/6},${200 - (monthlyTaxData[1].collected / getMaxValue() * 180)} 
                       L ${1000/6},${200 - (monthlyTaxData[2].collected / getMaxValue() * 180)} 
                       L ${1500/6},${200 - (monthlyTaxData[3].collected / getMaxValue() * 180)} 
                       L ${2000/6},${200 - (monthlyTaxData[4].collected / getMaxValue() * 180)} 
                       L ${2500/6},${200 - (monthlyTaxData[5].collected / getMaxValue() * 180)} 
                       L 500,200 L 0,200 Z`}
                  fill="url(#collectedGradient)"
                />
                {/* Paid Area */}
                <path
                  d={`M 0,${200 - (monthlyTaxData[0].paid / getMaxValue() * 180)} 
                       L ${500/6},${200 - (monthlyTaxData[1].paid / getMaxValue() * 180)} 
                       L ${1000/6},${200 - (monthlyTaxData[2].paid / getMaxValue() * 180)} 
                       L ${1500/6},${200 - (monthlyTaxData[3].paid / getMaxValue() * 180)} 
                       L ${2000/6},${200 - (monthlyTaxData[4].paid / getMaxValue() * 180)} 
                       L ${2500/6},${200 - (monthlyTaxData[5].paid / getMaxValue() * 180)} 
                       L 500,200 L 0,200 Z`}
                  fill="url(#paidGradient)"
                />
                {/* Collected Line */}
                <polyline
                  points={monthlyTaxData.map((d, i) => 
                    `${i * (500/6)},${200 - (d.collected / getMaxValue() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                {/* Paid Line */}
                <polyline
                  points={monthlyTaxData.map((d, i) => 
                    `${i * (500/6)},${200 - (d.paid / getMaxValue() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
              </svg>
            </div>
            
            <div className="flex justify-between mt-4">
              {monthlyTaxData.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d.month}</p>
                  <p className="text-[9px] font-bold text-emerald-500">{d.collected}€</p>
                  <p className="text-[8px] text-rose-500">{d.paid}€</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Distribution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <PieChart size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Répartition des taxes</h3>
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
                    strokeDasharray={`${(taxData.vat.net / totalTaxes) * 283} 283`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="10"
                    strokeDasharray={`${(taxData.corporateTax.amount / totalTaxes) * 283} 283`}
                    strokeDashoffset={`-${(taxData.vat.net / totalTaxes) * 283}`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={`${(taxData.otherTaxes.total / totalTaxes) * 283} 283`}
                    strokeDashoffset={`-${((taxData.vat.net + taxData.corporateTax.amount) / totalTaxes) * 283}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-sm">TVA Nette</span>
                </div>
                <span className="text-sm font-medium">{taxData.vat.net.toLocaleString()}€</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round((taxData.vat.net / totalTaxes) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-sm">Impôt sur les Sociétés</span>
                </div>
                <span className="text-sm font-medium">{taxData.corporateTax.amount.toLocaleString()}€</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round((taxData.corporateTax.amount / totalTaxes) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-sm">Autres taxes</span>
                </div>
                <span className="text-sm font-medium">{taxData.otherTaxes.total.toLocaleString()}€</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round((taxData.otherTaxes.total / totalTaxes) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REST OF THE COMPONENT CONTINUES... */}
        
        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Tax Report • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Conforme aux normes fiscales françaises
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}