// frontend/app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  Receipt,
  BarChart3,
  FileText,
  AlertTriangle,
  DollarSign,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Zap,
  Activity,
  Target,
  Shield,
  RefreshCw,
  Eye,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import dashboardService from "@/app/services/dashboard/dashboard.service";
import { Product } from "@/app/types/dashboard";
import InvoicesTable from "@/app/components/invoices/InvoicesTable";
import DashboardCharts from "@/app/components/Dashboard/DashboardCharts";
import QuickActions from "@/app/components/Dashboard/QuickActions";
import StatCard from "@/app/dashboard/StatCard";
import StockAlert from "@/app/components/Dashboard/StockAlert";
import PerformanceBadge from "@/app/components/ui/PerformanceBadge";
import { formatDA, parseAmount } from "@/app/lib/utils";
import SubscriptionExpired from "@/app/components/SubscriptionExpired";
import RealTimeClock from "@/app/components/Dashboard/RealTimeClock";

export const metadata = {
  title: 'Dashboard - Velora ERP',
  description: "Tableau de bord principal de Velora ERP",
};

interface SubscriptionError {
  success: false;
  error_code: "SUBSCRIPTION_EXPIRED";
  message: string;
  data: {
    expiredSince: string;
    daysOverdue: number;
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  try {
    const [dashboardResult, quickStatsResult] = await Promise.allSettled([
      dashboardService.getDashboardStats(token),
      dashboardService.getQuickStats(token)
    ]);

    if (dashboardResult.status === 'rejected') {
      const error = dashboardResult.reason as any;
      if (error?.response?.data?.error_code === "SUBSCRIPTION_EXPIRED" || 
          error?.error_code === "SUBSCRIPTION_EXPIRED") {
        const subscriptionError: SubscriptionError = {
          success: false,
          error_code: "SUBSCRIPTION_EXPIRED",
          message: error?.response?.data?.message || "باقة الاشتراك منتهية، يرجى التجديد",
          data: error?.response?.data?.data || { expiredSince: new Date().toISOString(), daysOverdue: 0 }
        };
        return <SubscriptionExpired error={subscriptionError} />;
      }
      console.error("Dashboard data fetch failed:", error);
    }

    const stats = dashboardResult.status === 'fulfilled' 
      ? dashboardResult.value?.stats 
      : { 
          invoices: { total: 0, count: 0, paid: 0, due: 0 },
          payments: { total: 0, count: 0 },
          clients: { total: 0, totalBalance: 0 },
          products: { total: 0, lowStock: 0, totalStockValue: 0 } 
        };

    const recentInvoices = dashboardResult.status === 'fulfilled' 
      ? (dashboardResult.value?.overview?.recentInvoices || []).map((inv: any) => ({
          ...inv,
          issueDate: inv.issueDate || inv.date || inv.createdAt || new Date(),
          _id: inv._id || inv.id,
          invoiceNumber: inv.invoiceNumber || `INV-${inv._id?.slice(-6) || '0000'}`,
          total: inv.total || inv.amount || 0,
          paidAmount: inv.paidAmount || 0,
          status: inv.status || 'draft',
          clientName: inv.clientName || (inv.clientId?.name) || 'Client inconnu',
          clientId: inv.clientId,
        }))
      : [];
      
    const lowStockProducts = dashboardResult.status === 'fulfilled'
      ? dashboardResult.value?.overview?.lowStockProducts || []
      : [];
      
    const monthlySales = dashboardResult.status === 'fulfilled'
      ? dashboardResult.value?.charts?.monthlySales || []
      : [];

    const quickStatsData = quickStatsResult.status === 'fulfilled' 
      ? quickStatsResult.value 
      : { today: { total: 0 }, yesterday: { total: 0 }, draftCount: 0 };

    const sanitizedProducts: Product[] = lowStockProducts.map((p) => ({
      ...p,
      _id: String(p._id || p.id || crypto.randomUUID()),
      price: parseAmount(p.price ?? 0),
      stock: Number(p.stock ?? 0),
      minStock: Number(p.minStock ?? 5),
    }));

    const totalInvoiced = stats?.invoices?.total ?? 0;
    const totalPaid = stats?.invoices?.paid ?? 0;
    const totalDue = stats?.invoices?.due ?? 0;
    const totalStockValue = stats?.products?.totalStockValue ?? 0;
    const recoveryRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
    
    const todaySales = quickStatsData?.today?.total ?? 0;
    const yesterdaySales = quickStatsData?.yesterday?.total ?? 0;
    const salesChange = yesterdaySales > 0 
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : todaySales > 0 ? 100 : 0;

    const currentMonth = new Date().toLocaleDateString("fr-FR", { month: "long" });
    const isLowStockCritical = sanitizedProducts.length > 5;
    const lastUpdated = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="relative w-full space-y-2 animate-fade-in pb-0">
        {/* Header - Compact */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl lg:text-3xl font-black text-[var(--foreground)] uppercase tracking-tighter italic leading-none">
                Tableau de bord
                <span className="text-[var(--accent)] ml-1">.</span>
              </h1>
              <PerformanceBadge rate={recoveryRate} />
            </div>
            
            {/* Stock Value Card */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--card-bg)] backdrop-blur-md border border-[var(--border)] rounded-xl shadow-md w-fit">
              <Package size={14} className="text-[var(--accent)]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                  Valeur du Stock
                </span>
                <span className="text-sm font-bold text-[var(--accent)]">
                  {formatDA(totalStockValue)} DA
                </span>
              </div>
            </div>
          </div>

          {/* Right header cards */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {/* Sales comparison */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-lg">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Hier</span>
                <span className="text-xs font-bold text-[var(--foreground)]">{formatDA(yesterdaySales)} DA</span>
              </div>
              <div className="w-px h-5 bg-[var(--border)]" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-[var(--accent)] uppercase tracking-wider flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]"></span>
                  </span>
                  Aujourd'hui
                </span>
                <span className="text-xs font-black text-[var(--foreground)]">{formatDA(todaySales)} DA</span>
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md border shadow-sm ${
                salesChange >= 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}>
                {salesChange >= 0 ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
                {Math.abs(salesChange)}%
              </div>
            </div>

            {/* Real-time Clock (replaces old static date/time) */}
            <RealTimeClock lastUpdated={lastUpdated} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 lg:gap-3">
          <StatCard
            title="Chiffre d'affaires"
            value={totalInvoiced}
            isCurrency
            trendValue={`${stats?.invoices?.count || 0} factures`}
            icon={<TrendingUp size={16} />}
            color="lime" 
            delay={0}
          />
          <StatCard
            title="Recouvrement"
            value={totalPaid}
            isCurrency
            trendValue={`${formatDA(totalDue)} DA restant`}
            icon={<DollarSign size={16} />}
            color="mint"
            delay={100}
          />
          <StatCard
            title="Brouillons"
            value={quickStatsData?.draftCount ?? 0}
            trendValue="En attente"
            icon={<FileText size={16} />}
            color="gold"
            delay={200}
          />
          <StatCard
            title="Stock Critique"
            value={sanitizedProducts.length}
            trendValue={`${sanitizedProducts.length} alertes`}
            icon={<Package size={16} />}
            color={sanitizedProducts.length > 5 ? "rose" : "royal"}
            delay={300}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 lg:gap-4">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-3">
            {/* Chart */}
            <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-4 pt-3 pb-1 flex justify-between items-center">
                <h3 className="font-black uppercase text-[9px] tracking-[0.2em] text-[var(--foreground-muted)] flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-[var(--accent)]" />
                  Performance {currentMonth}
                </h3>
                {monthlySales.length > 0 && (
                  <span className="text-[12px] font-black text-[var(--foreground-muted)] bg-[var(--card-bg)] px-2 py-1 rounded-full border border-[var(--border)]">
                    vs mois dernier
                  </span>
                )}
              </div>
              {monthlySales.length > 0 ? (
                <div className="p-2">
                  <DashboardCharts data={monthlySales} height={180} />
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center opacity-60">
                  <div className="p-2 bg-[var(--card-bg)] rounded-full mb-2">
                    <BarChart3 size={24} className="text-[var(--foreground-muted)]" />
                  </div>
                  <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)]">Aucune donnée</p>
                </div>
              )}
            </div>

            {/* Invoices Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-black uppercase text-[9px] tracking-[0.2em] text-[var(--foreground-muted)] flex items-center gap-1.5">
                  <Receipt size={12} className="text-[var(--accent)]" />
                  Flux de Facturation
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] text-[var(--foreground-muted)] bg-[var(--card-bg)] px-2 py-1 rounded-full border border-[var(--border)]">
                    {recentInvoices.length} dernières
                  </span>
                  {recentInvoices.length > 0 && (
                    <Link href="/dashboard/invoices" className="text-[7px] font-black text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors flex items-center gap-1">
                      Voir tout <Eye size={9} />
                    </Link>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-2xl overflow-hidden">
                <InvoicesTable 
                  invoices={recentInvoices}
                  showClient={true}
                  showStatus={true}
                  showDate={true}
                  showDueDate={false}
                  showActions={true}
                  showPayment={false}
                  showDelete={false}
                  showPdf={false}
                  showPagination={false}
                  variant="compact"
                  basePath="/dashboard/invoices"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Health (fully compact) */}
          <div className="space-y-2">
            <div className="sticky top-2 space-y-2">
              <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 lg:p-3">
                  <div className="flex items-center justify-between mb-1 border-b border-[var(--border)] pb-1">
                    <h3 className="font-black uppercase text-[8px] tracking-wider text-[var(--foreground-muted)] flex items-center gap-1">
                      <Activity size={10} className="text-[var(--accent)]" />
                      Santé Entreprise
                    </h3>
                    <Shield size={10} className="text-[var(--foreground-muted)]" />
                  </div>
                  <div className="space-y-2">
                    {/* Recovery Rate - compact */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <span className="text-[13px] font-black uppercase text-[var(--foreground-muted)] flex items-center gap-1">
                          <Target size={13} className="text-[var(--accent)]" />
                          Taux Recouvrement
                        </span>
                        <span className="text-base font-black text-green-500 italic">{recoveryRate}%</span>
                      </div>
                      <div className="relative h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div className="absolute h-full bg-gradient-to-r from-green-200 to-green-600 rounded-full" style={{ width: `${Math.min(recoveryRate, 100)}%` }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-[12px] text-[var(--foreground-muted)] uppercase tracking-wider">Objectif: 85%</p>
                    </div>

                    {/* Stock Alerts (max 2) */}
                    {sanitizedProducts.length > 0 && (
                      <div className="pt-1 border-t border-[var(--border)]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-[var(--foreground-muted)] uppercase flex items-center gap-1">
                            <AlertTriangle size={9} className="text-amber-400" />
                            Alertes Stock
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                            isLowStockCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {sanitizedProducts.length} active{sanitizedProducts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1 max-h-[130px] overflow-y-auto custom-scrollbar pr-1">
                          {sanitizedProducts.slice(0, 2).map((product) => (
                            <StockAlert key={product._id} product={product} />
                          ))}
                          {sanitizedProducts.length > 2 && (
                            <Link href="/dashboard/products?filter=low-stock" className="block w-full mt-0.5 py-0.5 text-center text-[6px] font-black text-[var(--foreground-muted)] hover:text-[var(--accent)] uppercase tracking-wider transition-colors">
                              + {sanitizedProducts.length - 2} autres
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Financial Summary - compact */}
                    <div className="pt-1 border-t border-[var(--border)]">
                      <div className="p-2 bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background)] rounded-lg border border-[var(--border)]">
                        <div className="flex items-start gap-1.5">
                          <div className="p-1 bg-[var(--accent)]/20 rounded-md">
                            <Zap size={10} className="text-[var(--accent)]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-black uppercase text-[var(--foreground-muted)] mb-0.5">Synthèse Financière</p>
                            <p className="text-[13px] font-bold text-[var(--foreground)]">
                              CA total: <span className="text-[var(--accent)]">{formatDA(totalInvoiced)} DA</span>
                            </p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Payé</span>
                                <span className="text-[10px] font-bold text-green-400">{formatDA(totalPaid)} DA</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Dû</span>
                                <span className="text-[10px] font-bold text-rose-400">{formatDA(totalDue)} DA</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <QuickActions />
      </div>
    );
  } catch (error: any) {
    console.error("Unexpected error in dashboard:", error);
    if (error?.response?.data?.error_code === "SUBSCRIPTION_EXPIRED") {
      const subscriptionError: SubscriptionError = {
        success: false,
        error_code: "SUBSCRIPTION_EXPIRED",
        message: error.response.data.message,
        data: error.response.data.data
      };
      return <SubscriptionExpired error={subscriptionError} />;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background-secondary)] via-[var(--background)] to-[var(--background-secondary)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Une erreur est survenue</h2>
          <p className="text-[var(--foreground-muted)] mb-6">Veuillez réessayer plus tard</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-[var(--accent)]/20 text-[var(--accent)] px-6 py-3 rounded-xl border border-[var(--accent)]/30 hover:bg-[var(--accent)]/30 transition-colors">
            <RefreshCw size={16} />
            Réessayer
          </Link>
        </div>
      </div>
    );
  }
}