// app/dashboard/payment/reports/page.tsx
import { cookies } from "next/headers";
import { paymentService } from "@/app/services/paymentServices";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  PieChart as PieIcon,
  ArrowLeftRight,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import EmptyState from "@/app/components/EmptyState";
import ReportsActions from "@/app/components/reports/ReportsActions";
import type { 
  StatsResponse, 
  SummaryStat, 
  MethodStat, 
  DailyStat 
} from "@/app/types/reports";

export const metadata = {
  title: "Velora ERP | Rapports Financiers",
  description: "Analyse des performances et flux de trésorerie",
};

export default async function PaymentReportsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 1. Fetch data with error handling
  let stats: StatsResponse = { summary: [], methods: [], daily: [] };
  let hasError = false;
  
  try {
    const response = await paymentService.getStats(token);
    console.log("📊 Stats API Response:", response);
    
    if (response) {
      stats = {
        summary: Array.isArray(response.summary) ? response.summary : 
                 (response.total !== undefined ? [{ total: response.total, count: response.count || 0, avg: response.avg || 0 }] : []),
        methods: Array.isArray(response.methods) ? response.methods : 
                 (response.byMethod ? Object.entries(response.byMethod).map(([key, value]: [string, any]) => ({ 
                   _id: key, 
                   total: value.total || value, 
                   count: value.count || 0 
                 })) : []),
        daily: Array.isArray(response.daily) ? response.daily : 
               (response.dailyStats ? response.dailyStats : [])
      };
    }
    
    console.log("📊 Stats processed:", stats);
  } catch (error) {
    console.error("❌ Failed to fetch stats:", error);
    hasError = true;
  }

  // 2. Use mock data for development if needed
  if (process.env.NODE_ENV === 'development' && (hasError || (stats.summary.length === 0 && stats.methods.length === 0 && stats.daily.length === 0))) {
    console.log("📊 Using mock data for development");
    stats = {
      summary: [{ total: 12500, count: 42, avg: 297.62 }],
      methods: [
        { _id: 'CARTE BANCAIRE', total: 8750, count: 28 },
        { _id: 'VIREMENT', total: 2500, count: 10 },
        { _id: 'PAYPAL', total: 1250, count: 4 }
      ],
      daily: [
        { _id: '22/02/2024', total: 1250, count: 5 },
        { _id: '21/02/2024', total: 2500, count: 8 },
        { _id: '20/02/2024', total: 1875, count: 7 },
        { _id: '19/02/2024', total: 950, count: 4 },
        { _id: '18/02/2024', total: 2100, count: 9 },
        { _id: '17/02/2024', total: 1750, count: 6 },
        { _id: '16/02/2024', total: 2075, count: 8 }
      ]
    };
  }

  // 3. Extract data safely
  const summary: SummaryStat = stats.summary.length > 0 
    ? stats.summary[0] 
    : { total: 0, count: 0, avg: 0 };
  const totalTransactions = summary.count || 0;
  const totalAmount = summary.total || 0;
  const averageAmount = summary.avg || 0;
  
  const methodStats: MethodStat[] = stats.methods || [];
  const topMethod: MethodStat | null = methodStats.length > 0 
    ? methodStats.reduce((max: MethodStat, m: MethodStat) => (m.total > max.total ? m : max), methodStats[0])
    : null;

  const dailyStats: DailyStat[] = stats.daily || [];
  const bestDay: DailyStat | null = dailyStats.length > 0
    ? dailyStats.reduce((max: DailyStat, d: DailyStat) => (d.total > max.total ? d : max), dailyStats[0])
    : null;

  // 4. Show empty state if no data in production
  if (!hasError && stats.summary.length === 0 && stats.methods.length === 0 && stats.daily.length === 0 && process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5 p-8">
        <div className="max-w-7xl mx-auto bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-black italic mb-2 text-zinc-900 dark:text-white">Aucune donnée disponible</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Il n'y a pas encore de transactions pour générer des rapports financiers.
          </p>
          <Link 
            href="/dashboard/payment/new"
            className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase hover:bg-[var(--accent)]/90 transition-all"
          >
            + Créer un paiement
          </Link>
        </div>
      </div>
    );
  }

  // 5. Main layout with gradient background
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Header with Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payment"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <BarChart3 size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • PAYMENT
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● REPORTS
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapports <span className="text-[var(--accent)]">Financiers</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Analyse des performances et flux de trésorerie
              </p>
            </div>
          </div>

          <ReportsActions stats={stats} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Encaissé" 
            value={`${totalAmount.toLocaleString('fr-FR')} DZD`} 
            subLabel="Période actuelle"
            icon={<DollarSign className="text-emerald-500" />}
            trend={totalAmount > 0 ? "+12.5%" : "0%"}
            trendUp={true}
            color="emerald"
          />
          <StatCard 
            label="Transactions" 
            value={totalTransactions.toLocaleString('fr-FR')} 
            subLabel="Paiements confirmés"
            icon={<TrendingUp className="text-blue-500" />}
            trend={totalTransactions > 0 ? "+8.3%" : "0%"}
            trendUp={true}
            color="blue"
          />
          <StatCard 
            label="Moyenne / Paiement" 
            value={`${Math.round(averageAmount).toLocaleString('fr-FR')} DZD`} 
            subLabel="Panier moyen"
            icon={<PieIcon className="text-amber-500" />}
            trend={averageAmount > 0 ? "-2.1%" : "0%"}
            trendUp={false}
            color="amber"
          />
          <StatCard 
            label="Méthode Top" 
            value={topMethod ? topMethod._id || 'N/A' : 'N/A'} 
            subLabel={topMethod ? `${topMethod.count} transactions` : 'Aucune donnée'}
            icon={<ArrowLeftRight className="text-purple-500" />}
            trend={topMethod && totalAmount > 0 ? `${Math.round((topMethod.total/totalAmount)*100)}%` : "0%"}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Daily Flux - takes 2 columns */}
          <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <Calendar size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Flux Journalier</h3>
              </div>
              {bestDay && (
                <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                  Meilleur jour: {bestDay._id} ({bestDay.total.toLocaleString()} DZD)
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {dailyStats.length > 0 ? (
                dailyStats.map((day, idx) => {
                  const percentage = totalAmount > 0 ? (day.total / totalAmount) * 100 : 0;
                  const isMax = bestDay?._id === day._id;
                  
                  return (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-[var(--foreground-muted)] uppercase">
                          {day._id}
                        </span>
                        <span className="text-[10px] font-black text-[var(--foreground)]">
                          {day.total.toLocaleString()} DZD
                        </span>
                      </div>
                      <div className="relative h-3 bg-[var(--border)] rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                            isMax ? 'bg-emerald-500' : 'bg-[var(--accent)]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="absolute right-1 top-0 bottom-0 w-1 bg-white/30"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[8px] text-[var(--foreground-muted)]">{percentage.toFixed(1)}%</span>
                        <span className="text-[8px] text-[var(--foreground-muted)]">{day.count} transactions</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState message="Aucune donnée journalière" />
              )}
            </div>
          </div>

          {/* Payment Methods Distribution - FIXED: now uses theme variables */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <PieIcon size={14} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-black">Modes de Paiement</h3>
            </div>
            
            <div className="space-y-3">
              {methodStats.length > 0 ? (
                methodStats.map((method, index) => {
                  const percentage = totalAmount > 0 ? (method.total / totalAmount) * 100 : 0;
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={method._id} className="p-4 rounded-xl bg-[var(--accent)]/5 border border-[var(--border)] hover:bg-[var(--accent)]/10 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
                          <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">
                            {method._id || 'Autre'}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-[var(--foreground)]">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-black italic text-[var(--foreground)]">
                          {method.total.toLocaleString()} DZD
                        </span>
                        <span className="text-[8px] font-black uppercase bg-[var(--accent)]/10 text-[var(--foreground-muted)] px-2 py-1 rounded-full">
                          {method.count} txn
                        </span>
                      </div>

                      <div className="mt-2 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState message="Aucune méthode enregistrée" />
              )}
            </div>
            
            <div className="mt-4 p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
              <p className="text-[8px] font-black uppercase tracking-wider text-[var(--accent)] text-center">
                Analyse basée sur les paiements complétés
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Payment Reports • v2.0.0
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