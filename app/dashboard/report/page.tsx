"use client";

import { useState, useEffect } from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Settings,
  ArrowRight,
  Calendar,
  Download,
  Clock,
  Shield,
  Zap,
  Eye,
  RefreshCw,
} from "lucide-react";

// ملاحظة: إذا كان هذا الملف في Next.js App Router، الـ Metadata توضع في ملف layout أو ملف server component منفصل.
// بما أننا استخدمنا "use client" للوقت الحي، سنركز على المكون نفسه.

interface ReportCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge?: string;
  metrics?: { label: string; value: string; change?: number }[];
}

export default function ReportsPage() {
  // --- Logic: Live Clock & Sync ---
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // تحديث كل دقيقة
    return () => clearInterval(timer);
  }, []);

  const reportCards: ReportCard[] = [
    {
      title: "Rapport Financier",
      description: "Analyse des revenus, dépenses et bénéfices",
      icon: DollarSign,
      href: "/dashboard/report/financial",
      color: "from-emerald-500/20 to-emerald-500/5",
      badge: "CA: 124 500€",
      metrics: [
        { label: "Chiffre d'affaires", value: "124 500€", change: 11.16 },
        { label: "Bénéfice net", value: "79 300€", change: 16.28 },
        { label: "Marge", value: "63.7%", change: 5.2 }
      ]
    },
    {
      title: "Rapport Fiscal",
      description: "Suivi des taxes et obligations fiscales",
      icon: Shield,
      href: "/dashboard/report/tax",
      color: "from-purple-500/20 to-purple-500/5",
      badge: "TVA: 24 800€",
      metrics: [
        { label: "TVA collectée", value: "24 800€", change: 10.7 },
        { label: "Impôt société", value: "18 900€", change: 16.7 },
        { label: "Taux effectif", value: "25%", change: 0 }
      ]
    },
    {
      title: "Rapport Clients",
      description: "Analyse du portefeuille clients",
      icon: Users,
      href: "/dashboard/report/clients",
      color: "from-blue-500/20 to-blue-500/5",
      badge: "284 clients",
      metrics: [
        { label: "Total clients", value: "284", change: 17.4 },
        { label: "Clients actifs", value: "238", change: 12.3 },
        { label: "Taux fidélisation", value: "89.4%", change: 5.2 }
      ]
    },
    {
      title: "Rapport Produits",
      description: "Performance des produits et stock",
      icon: Package,
      href: "/dashboard/report/products",
      color: "from-amber-500/20 to-amber-500/5",
      badge: "156 produits",
      metrics: [
        { label: "CA produits", value: "1 245 000€", change: 11.16 },
        { label: "Unités vendues", value: "1 234", change: 18.5 },
        { label: "Prix moyen", value: "1 824€", change: 5.2 }
      ]
    },
    {
      title: "Rapport Ventes",
      description: "Analyse des performances commerciales",
      icon: TrendingUp,
      href: "/dashboard/report/sales",
      color: "from-cyan-500/20 to-cyan-500/5",
      badge: "+15.2%",
      metrics: [
        { label: "Ventes totales", value: "142 500€", change: 15.2 },
        { label: "Transactions", value: "1 234", change: 12.5 },
        { label: "Panier moyen", value: "115€", change: 2.4 }
      ]
    },
    {
      title: "Rapport Personnalisé",
      description: "Créez vos propres rapports sur mesure",
      icon: Settings,
      href: "/dashboard/report/custom",
      color: "from-rose-500/20 to-rose-500/5",
      badge: "Builder",
      metrics: [
        { label: "Rapports sauvegardés", value: "12", change: 3 },
        { label: "Colonnes disponibles", value: "25", change: 0 },
        { label: "Filtres actifs", value: "3", change: 0 }
      ]
    }
  ];

  const recentReports = [
    { name: "Rapport financier Q4 2023", date: "2024-01-15", type: "Financier", size: "2.4 MB" },
    { name: "Analyse clients décembre", date: "2024-01-10", type: "Clients", size: "1.8 MB" },
    { name: "Performance produits 2023", date: "2024-01-05", type: "Produits", size: "3.1 MB" },
    { name: "Déclaration TVA T4", date: "2024-01-02", type: "Fiscal", size: "1.2 MB" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl border border-[var(--accent)]/10">
                <BarChart3 size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    VELORA • REPORTS
                  </span>
                  <span className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> ANALYTICS
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter italic">
                  Rapports & <span className="text-[var(--accent)]">Analyses.</span>
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none px-4 py-2 bg-[var(--card-bg)]/50 backdrop-blur-md border border-[var(--border)] rounded-xl shadow-sm text-center">
              <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">Période</p>
              <p className="text-sm font-black text-[var(--foreground)]">Année 2024</p>
            </div>
            <div className="flex-1 sm:flex-none px-4 py-2 bg-[var(--card-bg)]/50 backdrop-blur-md border border-[var(--border)] rounded-xl shadow-sm text-center relative overflow-hidden group">
              <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">Live Sync</p>
              <div className="flex items-center justify-center gap-1.5">
                <RefreshCw size={12} className="text-emerald-500 animate-spin-slow" />
                <p className="text-sm font-black text-emerald-500 tabular-nums">
                  {currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex flex-wrap gap-2 p-3 bg-[var(--card-bg)]/40 backdrop-blur-sm border border-[var(--border)] rounded-2xl">
          <div className="flex items-center px-2 mr-2">
             <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Actions :</span>
          </div>
          <Link
            href="/dashboard/report/custom"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            <Settings size={14} />
            Nouveau rapport
          </Link>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <Download size={14} className="text-[var(--accent)]" />
            Exporter
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <Calendar size={14} className="text-[var(--accent)]" />
            Période
          </button>
        </div>

        {/* REPORTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.title}
                href={report.href}
                className="group relative overflow-hidden bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-2xl hover:shadow-[var(--accent)]/10"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-2.5 rounded-xl bg-[var(--accent)]/10 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300">
                      <Icon size={22} />
                    </div>
                    {report.badge && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                        {report.badge}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-black text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {report.title}
                  </h3>
                  
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed mb-6 h-8 line-clamp-2">
                    {report.description}
                  </p>

                  {report.metrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-4 border-t border-[var(--border)]">
                      {report.metrics.map((metric, idx) => (
                        <div key={idx} className="text-center">
                          <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-tighter mb-1">{metric.label}</p>
                          <p className="text-sm font-black text-[var(--foreground)] tabular-nums">{metric.value}</p>
                          {metric.change !== undefined && (
                            <p className={`text-[9px] font-bold mt-0.5 ${metric.change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <div className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2">
                      Analyser <ArrowRight size={12} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* BOTTOM SECTION: RECENT & INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Recent Reports List */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-[var(--accent)]" />
                <h3 className="text-sm font-black uppercase tracking-tight">Archives Récentes</h3>
              </div>
              <button className="text-[10px] font-black text-[var(--accent)] uppercase hover:tracking-widest transition-all">Tout voir</button>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {recentReports.map((report, idx) => (
                <div key={idx} className="p-4 hover:bg-[var(--accent)]/5 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold group-hover:text-[var(--accent)] transition-colors">{report.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[var(--foreground-muted)]">{report.date}</span>
                        <span className="h-1 w-1 bg-[var(--border)] rounded-full" />
                        <span className="text-[9px] font-black text-[var(--accent)] uppercase">{report.type}</span>
                        <span className="text-[10px] text-[var(--foreground-muted)]">{report.size}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-[var(--border)] transition-all shadow-sm">
                        <Download size={14} className="text-[var(--foreground-muted)]" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-[var(--border)] transition-all shadow-sm">
                        <Eye size={14} className="text-[var(--foreground-muted)]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights / Key Metrics Progress */}
          <div className="bg-[#0f172a] text-white border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={120} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Zap size={18} className="text-emerald-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Velora AI Insights</h3>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Objectif Chiffre d'Affaires", val: 65, color: "bg-emerald-500", trend: "+15.2%" },
                  { label: "Rétention Client (Annuel)", val: 89, color: "bg-blue-500", trend: "+5.2%" },
                  { label: "Performance Stock", val: 72, color: "bg-amber-500", trend: "+18.5%" }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">{item.label}</span>
                      <span className="text-xs font-black text-emerald-400">{item.trend}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] leading-relaxed text-slate-300 italic">
                  "L'analyse actuelle indique أن أداء المبيعات تجاوز التوقعات بنسبة 12%. يُنصح بزيادة المخزون من الفئة Premium لمواجهة طلب الربع القادم."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--foreground-muted)] font-mono uppercase tracking-tighter">
            Système de reporting Velora v3.2 • Secure Encryption Active
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">PDF</span>
            <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Excel</span>
            <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">CSV</span>
          </div>
        </div>
      </div>
    </div>
  );
}