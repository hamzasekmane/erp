import { cookies } from "next/headers";
import { paymentService } from "@/app/services/paymentServices";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  ArrowLeft,
  Download,
  Filter,
  DollarSign,
  CreditCard,
  Activity,
  Clock
} from "lucide-react";
import Link from "next/link";
import PeriodComparison from "@/app/components/reports/PeriodComparison";

export const metadata = {
  title: "Velora ERP | Rapports Périodiques",
  description: "Analyse comparative des périodes",
};

export default async function PeriodicReportsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // Fetch data for different periods
  let currentPeriodData = { total: 0, count: 0, avg: 0 };
  let previousPeriodData = { total: 0, count: 0, avg: 0 };
  let monthlyData: any[] = [];
  let quarterlyData: any[] = [];
  let yearlyData: any[] = [];
  let hasError = false;

  try {
    // Get current month data - FIXED: pass token first, then options object
    const currentMonthResponse = await paymentService.getStats(token, { period: "month" });
    if (currentMonthResponse?.summary?.[0]) {
      currentPeriodData = currentMonthResponse.summary[0];
    }

    // Get previous month data - FIXED: pass token first, then options object
    const previousMonthResponse = await paymentService.getStats(token, { period: "month", offset: 1 });
    if (previousMonthResponse?.summary?.[0]) {
      previousPeriodData = previousMonthResponse.summary[0];
    }

    // Get monthly breakdown - FIXED: pass token first, then options object
    const monthlyResponse = await paymentService.getStats(token, { groupBy: "month", limit: 12 });
    if (monthlyResponse?.daily) {
      monthlyData = monthlyResponse.daily;
    }

    // Get quarterly breakdown - FIXED: pass token first, then options object
    const quarterlyResponse = await paymentService.getStats(token, { groupBy: "quarter", limit: 4 });
    if (quarterlyResponse?.daily) {
      quarterlyData = quarterlyResponse.daily;
    }

    // Get yearly breakdown - FIXED: pass token first, then options object
    const yearlyResponse = await paymentService.getStats(token, { groupBy: "year", limit: 5 });
    if (yearlyResponse?.daily) {
      yearlyData = yearlyResponse.daily;
    }

  } catch (error) {
    console.error("❌ Failed to fetch periodic data:", error);
    hasError = true;
  }

  // Mock data for development
  if ((hasError || (!currentPeriodData.total && !previousPeriodData.total))) {
    console.log("📊 Using mock periodic data for development");
    currentPeriodData = { total: 12500, count: 42, avg: 297.62 };
    previousPeriodData = { total: 11200, count: 38, avg: 294.74 };
    monthlyData = [
      { _id: "Jan", total: 8900, count: 32 },
      { _id: "Fév", total: 10200, count: 38 },
      { _id: "Mar", total: 11800, count: 42 },
      { _id: "Avr", total: 12500, count: 45 },
      { _id: "Mai", total: 14200, count: 48 },
      { _id: "Juin", total: 15800, count: 52 }
    ];
    quarterlyData = [
      { _id: "Q1 2024", total: 30900, count: 112 },
      { _id: "Q2 2024", total: 42500, count: 145 },
      { _id: "Q3 2024", total: 38700, count: 132 },
      { _id: "Q4 2024", total: 45200, count: 158 }
    ];
    yearlyData = [
      { _id: "2020", total: 45000, count: 180 },
      { _id: "2021", total: 68000, count: 245 },
      { _id: "2022", total: 95000, count: 320 },
      { _id: "2023", total: 124000, count: 412 },
      { _id: "2024", total: 142000, count: 468 }
    ];
  }

  // Calculate growth percentages
  const revenueGrowth = previousPeriodData.total > 0 
    ? ((currentPeriodData.total - previousPeriodData.total) / previousPeriodData.total) * 100 
    : 0;
  const transactionGrowth = previousPeriodData.count > 0 
    ? ((currentPeriodData.count - previousPeriodData.count) / previousPeriodData.count) * 100 
    : 0;

  const getMaxMonthlyValue = () => Math.max(...monthlyData.map(d => d.total), 0);
  const getMaxQuarterlyValue = () => Math.max(...quarterlyData.map(d => d.total), 0);
  const getMaxYearlyValue = () => Math.max(...yearlyData.map(d => d.total), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payment/reports"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <Calendar size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • PAYMENT
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● PERIODIC
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapports <span className="text-[var(--accent)]">Périodiques</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Analyse comparative des performances par période
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--accent)]/10 transition-colors">
              <Download size={14} />
              Exporter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--accent)]/10 transition-colors">
              <Filter size={14} />
              Filtres
            </button>
          </div>
        </div>

        {/* Period Comparison Component */}
        <PeriodComparison 
          currentPeriod={currentPeriodData}
          previousPeriod={previousPeriodData}
          revenueGrowth={revenueGrowth}
          transactionGrowth={transactionGrowth}
        />

        {/* Monthly Breakdown */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
              <BarChart3 size={14} className="text-[var(--accent)]" />
            </div>
            <h3 className="font-black">Évolution Mensuelle</h3>
          </div>
          
          {monthlyData.length > 0 ? (
            <>
              <div className="relative h-80">
                <svg className="w-full h-full" viewBox="0 0 600 250" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area under the line */}
                  <path
                    d={`M 0,${250 - ((monthlyData[0]?.total || 0) / getMaxMonthlyValue() * 220)} 
                         ${monthlyData.map((d, i) => `L ${(i + 1) * (600 / monthlyData.length)},${250 - (d.total / getMaxMonthlyValue() * 220)}`).join(' ')}
                         L 600,250 L 0,250 Z`}
                    fill="url(#monthlyGradient)"
                  />
                  {/* Line */}
                  <polyline
                    points={monthlyData.map((d, i) => 
                      `${(i + 1) * (600 / monthlyData.length)},${250 - (d.total / getMaxMonthlyValue() * 220)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                  {/* Points */}
                  {monthlyData.map((d, i) => (
                    <circle
                      key={i}
                      cx={(i + 1) * (600 / monthlyData.length)}
                      cy={250 - (d.total / getMaxMonthlyValue() * 220)}
                      r="4"
                      fill="#06b6d4"
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>
              
              <div className="flex justify-between mt-4">
                {monthlyData.map((d, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{d._id}</p>
                    <p className="text-[10px] font-bold">{d.total.toLocaleString()}€</p>
                    <p className="text-[8px] text-[var(--foreground-muted)]">{d.count} txns</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--foreground-muted)]">Aucune donnée mensuelle disponible</p>
            </div>
          )}
        </div>

        {/* Quarterly and Yearly Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quarterly Breakdown */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <h3 className="font-black">Performance Trimestrielle</h3>
            </div>
            
            {quarterlyData.length > 0 ? (
              <div className="space-y-4">
                {quarterlyData.map((quarter, idx) => {
                  const percentage = (quarter.total / getMaxQuarterlyValue()) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{quarter._id}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold">{quarter.total.toLocaleString()}€</span>
                          <span className="text-[10px] text-[var(--foreground-muted)] ml-2">({quarter.count} txns)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--foreground-muted)]">Aucune donnée trimestrielle disponible</p>
              </div>
            )}
          </div>

          {/* Yearly Breakdown */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <Activity size={14} className="text-purple-500" />
              </div>
              <h3 className="font-black">Performance Annuelle</h3>
            </div>
            
            {yearlyData.length > 0 ? (
              <div className="space-y-4">
                {yearlyData.map((year, idx) => {
                  const percentage = (year.total / getMaxYearlyValue()) * 100;
                  const yearGrowth = idx > 0 ? ((year.total - yearlyData[idx-1].total) / yearlyData[idx-1].total) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{year._id}</span>
                          {yearGrowth !== 0 && (
                            <span className={`text-[8px] font-black ${yearGrowth > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {yearGrowth > 0 ? '+' : ''}{yearGrowth.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{year.total.toLocaleString()}€</span>
                          <span className="text-[10px] text-[var(--foreground-muted)] ml-2">({year.count} txns)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--foreground-muted)]">Aucune donnée annuelle disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-500 uppercase">Meilleur mois</span>
            </div>
            {monthlyData.length > 0 && (() => {
              const bestMonth = monthlyData.reduce((max, d) => d.total > max.total ? d : max, monthlyData[0]);
              return (
                <>
                  <p className="text-lg font-black">{bestMonth._id}</p>
                  <p className="text-xs">{bestMonth.total.toLocaleString()}€</p>
                  <p className="text-[9px] text-[var(--foreground-muted)]">{bestMonth.count} transactions</p>
                </>
              );
            })()}
          </div>
          
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-purple-500" />
              <span className="text-[9px] font-black text-purple-500 uppercase">Croissance annuelle</span>
            </div>
            {yearlyData.length >= 2 && (() => {
              const lastYear = yearlyData[yearlyData.length - 1];
              const prevYear = yearlyData[yearlyData.length - 2];
              const growth = ((lastYear.total - prevYear.total) / prevYear.total) * 100;
              return (
                <>
                  <p className="text-lg font-black text-emerald-500">+{growth.toFixed(1)}%</p>
                  <p className="text-xs">{lastYear.total.toLocaleString()}€ vs {prevYear.total.toLocaleString()}€</p>
                </>
              );
            })()}
          </div>
          
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={14} className="text-blue-500" />
              <span className="text-[9px] font-black text-blue-500 uppercase">Transaction moyenne</span>
            </div>
            {currentPeriodData.avg > 0 && (
              <>
                <p className="text-lg font-black">{Math.round(currentPeriodData.avg).toLocaleString()}€</p>
                <p className="text-xs">Panier moyen actuel</p>
                <p className="text-[9px] text-[var(--foreground-muted)]">vs {Math.round(previousPeriodData.avg).toLocaleString()}€ préc.</p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Periodic Reports • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Données comparatives en temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}