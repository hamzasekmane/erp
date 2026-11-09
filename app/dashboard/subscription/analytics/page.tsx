"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Building2,
  Mail,
  Phone,
  FileText,
  Receipt,
  ArrowRight,
  Sparkles,
  Star,
  Wallet,
  ChartNoAxesCombined,
  Package,
  Percent,
  Timer,
  UserCheck,
  UserX
} from "lucide-react";

export default function SubscriptionAnalyticsPage() {
  const [period, setPeriod] = useState("month");
  const [isLoading, setIsLoading] = useState(false);

  // Statistiques globales
  const stats = {
    totalRevenue: 12450,
    previousRevenue: 11200,
    revenueGrowth: 11.16,
    activeSubscriptions: 142,
    previousSubscriptions: 128,
    subscriptionGrowth: 10.94,
    churnRate: 2.8,
    previousChurnRate: 3.2,
    churnImprovement: 12.5,
    avgRevenuePerUser: 87.68,
    previousAvgRevenue: 84.25,
    arpuGrowth: 4.07,
    mrr: 12450,
    arr: 149400,
    ltv: 2450,
    cac: 450
  };

  // Données mensuelles pour le graphique
  const monthlyData = [
    { month: "Jan", revenue: 8900, subscriptions: 98, churn: 3.2 },
    { month: "Fév", revenue: 9450, subscriptions: 105, churn: 3.0 },
    { month: "Mar", revenue: 10200, subscriptions: 112, churn: 2.9 },
    { month: "Avr", revenue: 10800, subscriptions: 118, churn: 2.8 },
    { month: "Mai", revenue: 11500, subscriptions: 125, churn: 2.7 },
    { month: "Juin", revenue: 12450, subscriptions: 142, churn: 2.8 }
  ];

  // Répartition par plan
  const planDistribution = [
    { name: "Starter", count: 45, revenue: 2205, percentage: 31.7, color: "bg-blue-500" },
    { name: "Professional", count: 82, revenue: 8118, percentage: 57.7, color: "bg-[var(--accent)]" },
    { name: "Enterprise", count: 15, revenue: 3735, percentage: 10.6, color: "bg-purple-500" }
  ];

  // Périodes d'abonnement
  const periodDistribution = [
    { name: "Mensuel", count: 98, percentage: 69, color: "bg-emerald-500" },
    { name: "Annuel", count: 44, percentage: 31, color: "bg-amber-500" }
  ];

  // Activité récente
  const recentActivities = [
    { id: 1, type: "new", customer: "TechCorp SAS", plan: "Professional", amount: 99, date: "2024-01-20", status: "success" },
    { id: 2, type: "upgrade", customer: "Innovation Labs", plan: "Enterprise", amount: 249, date: "2024-01-19", status: "success" },
    { id: 3, type: "renewal", customer: "Digital Solutions", plan: "Professional", amount: 99, date: "2024-01-18", status: "success" },
    { id: 4, type: "cancel", customer: "Startup Hub", plan: "Starter", amount: 49, date: "2024-01-17", status: "warning" },
    { id: 5, type: "new", customer: "Cloud Systems", plan: "Professional", amount: 99, date: "2024-01-16", status: "success" }
  ];

  const getMaxRevenue = () => Math.max(...monthlyData.map(d => d.revenue));
  const getMaxSubscriptions = () => Math.max(...monthlyData.map(d => d.subscriptions));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        
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
              <ChartNoAxesCombined size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • ANALYTICS
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● LIVE
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Analytique des <span className="text-[var(--accent)]">Abonnements</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Suivez les performances et la croissance de vos abonnements
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-1">
              {["week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    period === p 
                      ? 'bg-[var(--accent)] text-white' 
                      : 'hover:bg-[var(--accent)]/10'
                  }`}
                >
                  {p === "week" ? "Semaine" : p === "month" ? "Mois" : "Année"}
                </button>
              ))}
            </div>
            <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
              <RefreshCw size={16} className="text-[var(--foreground-muted)]" />
            </button>
            <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
              <Download size={16} className="text-[var(--foreground-muted)]" />
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <DollarSign size={16} className="text-emerald-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_01</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">MRR</p>
            <p className="text-2xl font-black text-emerald-500">{stats.mrr}€</p>
            <div className="flex items-center gap-1">
              {stats.revenueGrowth > 0 ? (
                <TrendingUp size={12} className="text-emerald-500" />
              ) : (
                <TrendingDown size={12} className="text-red-500" />
              )}
              <span className={`text-[10px] font-medium ${stats.revenueGrowth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                +{stats.revenueGrowth}%
              </span>
              <span className="text-[9px] text-[var(--foreground-muted)]">vs mois dernier</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
            </div>
          </div>

          {/* ARR */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <Wallet size={16} className="text-blue-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_02</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">ARR</p>
            <p className="text-2xl font-black text-blue-500">{stats.arr}€</p>
            <p className="text-[9px] text-[var(--foreground-muted)]">Revenu annualisé</p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[70%] h-full bg-blue-500 rounded-full" />
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <Users size={16} className="text-purple-500" />
              </div>
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">KPI_03</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Abonnements actifs</p>
            <p className="text-2xl font-black text-purple-500">{stats.activeSubscriptions}</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">+{stats.subscriptionGrowth}%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[65%] h-full bg-purple-500 rounded-full" />
            </div>
          </div>

          {/* Churn Rate */}
          <div className="p-5 bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/30 rounded-2xl space-y-2 group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <UserX size={16} className="text-rose-500" />
              </div>
              <span className="text-[8px] font-mono text-rose-500">ALERT</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Taux de résiliation</p>
            <p className="text-2xl font-black text-rose-500">{stats.churnRate}%</p>
            <div className="flex items-center gap-1">
              <TrendingDown size={12} className="text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">-{stats.churnImprovement}%</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="w-[28%] h-full bg-rose-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">ARPU</span>
              <Percent size={12} className="text-[var(--accent)]" />
            </div>
            <p className="text-xl font-black">{stats.avgRevenuePerUser}€</p>
            <p className="text-[9px] text-emerald-500">+{stats.arpuGrowth}% vs mois dernier</p>
          </div>
          
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">LTV</span>
              <Timer size={12} className="text-[var(--accent)]" />
            </div>
            <p className="text-xl font-black">{stats.ltv}€</p>
            <p className="text-[9px] text-[var(--foreground-muted)]">Valeur à vie client</p>
          </div>
          
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">CAC</span>
              <Package size={12} className="text-[var(--accent)]" />
            </div>
            <p className="text-xl font-black">{stats.cac}€</p>
            <p className="text-[9px] text-emerald-500">LTV/CAC: 5.4</p>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Chart */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <LineChart size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Évolution du CA</h3>
              </div>
              <span className="text-[9px] font-mono text-[var(--foreground-muted)]">Derniers 6 mois</span>
            </div>
            
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area under the line */}
                <path
                  d={`M 0,${200 - (monthlyData[0].revenue / getMaxRevenue() * 180)} 
                       L ${500/6},${200 - (monthlyData[1].revenue / getMaxRevenue() * 180)} 
                       L ${1000/6},${200 - (monthlyData[2].revenue / getMaxRevenue() * 180)} 
                       L ${1500/6},${200 - (monthlyData[3].revenue / getMaxRevenue() * 180)} 
                       L ${2000/6},${200 - (monthlyData[4].revenue / getMaxRevenue() * 180)} 
                       L ${2500/6},${200 - (monthlyData[5].revenue / getMaxRevenue() * 180)} 
                       L 500,200 L 0,200 Z`}
                  fill="url(#revenueGradient)"
                />
                {/* Line */}
                <polyline
                  points={monthlyData.map((d, i) => 
                    `${i * (500/6)},${200 - (d.revenue / getMaxRevenue() * 180)}`
                  ).join(' ')}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
                {/* Points */}
                {monthlyData.map((d, i) => (
                  <circle
                    key={i}
                    cx={i * (500/6)}
                    cy={200 - (d.revenue / getMaxRevenue() * 180)}
                    r="3"
                    fill="var(--accent)"
                  />
                ))}
              </svg>
            </div>
            
            <div className="flex justify-between mt-4">
              {monthlyData.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d.month}</p>
                  <p className="text-[10px] font-bold">{d.revenue}€</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriptions Chart */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <BarChart3 size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Évolution des abonnements</h3>
              </div>
              <span className="text-[9px] font-mono text-[var(--foreground-muted)]">Croissance +44%</span>
            </div>
            
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {monthlyData.map((d, i) => {
                  const height = (d.subscriptions / getMaxSubscriptions()) * 180;
                  const x = i * (500/6) + 20;
                  const width = 40;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={200 - height}
                      width={width}
                      height={height}
                      fill="var(--accent)"
                      opacity="0.7"
                      rx="4"
                    />
                  );
                })}
              </svg>
            </div>
            
            <div className="flex justify-between mt-4">
              {monthlyData.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d.month}</p>
                  <p className="text-[10px] font-bold">{d.subscriptions}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DISTRIBUTION SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Plan Distribution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <PieChart size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Répartition par plan</h3>
            </div>
            
            <div className="space-y-4">
              {planDistribution.map((plan) => (
                <div key={plan.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{plan.name}</span>
                    <span className="text-[var(--foreground-muted)]">{plan.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${plan.color} rounded-full`}
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mt-1">
                    <span>{plan.count} abonnés</span>
                    <span>{plan.revenue}€ CA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Period Distribution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <Calendar size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Périodes d'abonnement</h3>
            </div>
            
            <div className="flex items-center justify-center gap-8 mb-6">
              {periodDistribution.map((period) => (
                <div key={period.name} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-2">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={period.name === "Mensuel" ? "#10b981" : "#f59e0b"}
                        strokeWidth="10"
                        strokeDasharray={`${period.percentage * 2.83} ${283 - period.percentage * 2.83}`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black">{period.percentage}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{period.name}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">{period.count} abonnements</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                  <Activity size={16} className="text-[var(--accent)]" />
                </div>
                <h2 className="text-lg font-black">Activité récente</h2>
              </div>
              <Link href="/dashboard/subscription/activities" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                Voir tout
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Client</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Action</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Plan</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Montant</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Date</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-[var(--background)]/50 transition-colors">
                    <td className="p-4 text-sm font-medium">{activity.customer}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${
                        activity.type === 'new' ? 'bg-emerald-500/10 text-emerald-500' :
                        activity.type === 'upgrade' ? 'bg-blue-500/10 text-blue-500' :
                        activity.type === 'renewal' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {activity.type === 'new' ? 'Nouvel abonnement' :
                         activity.type === 'upgrade' ? 'Upgrade' :
                         activity.type === 'renewal' ? 'Renouvellement' : 'Annulation'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{activity.plan}</td>
                    <td className="p-4 text-sm font-medium">{activity.amount}€</td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">
                      {new Date(activity.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      {activity.status === 'success' ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Subscription Analytics • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Données mises à jour en temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}