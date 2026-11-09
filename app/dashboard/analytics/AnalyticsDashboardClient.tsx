'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Globe,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  Target,
  ChartLine,
  MousePointerClick,
} from 'lucide-react';

import { analyticsService } from '@/app/services/analytics';
import { SalesReportParams } from '@/app/services/analytics/analytics.api';
import {
  SalesReportData,
  PaymentReportData,
  ClientReportData,
  ProductReportData,
  AgingReportData,
  TopProductItem,
  TrafficSourceReportData,
} from '@/app/services/analytics/analytics.mapper';

// ==========================================
// TYPES
// ==========================================

interface AnalyticsCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  href: string;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'user' | 'product' | 'alert';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}

interface QuickStat {
  label: string;
  value: string | number;
  change: number;
}

interface TrafficSource {
  source: string;
  percentage: number;
  change: number;
  color: string;
}

interface TopProduct {
  name: string;
  revenue: number;
  sales: number;
  growth: number;
}

interface AnalyticsDashboardClientProps {
  token: string;
  initialData: {
    sales: SalesReportData | null;
    payments: PaymentReportData | null;
    clients: ClientReportData | null;
    products: ProductReportData | null;
    aging: AgingReportData | null;
    traffic?: TrafficSourceReportData | null;
  };
  initialDateRange: string;
}

// ==========================================
// COMPONENT
// ==========================================

export default function AnalyticsDashboardClient({
  token,
  initialData,
  initialDateRange,
}: AnalyticsDashboardClientProps) {
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<SalesReportData | null>(initialData.sales);
  const [paymentData, setPaymentData] = useState<PaymentReportData | null>(initialData.payments);
  const [clientData, setClientData] = useState<ClientReportData | null>(initialData.clients);
  const [productData, setProductData] = useState<ProductReportData | null>(initialData.products);
  const [agingData, setAgingData] = useState<AgingReportData | null>(initialData.aging);
  const [trafficData, setTrafficData] = useState<TrafficSourceReportData | null>(initialData.traffic || null);

  const getPeriodParams = (range: string): SalesReportParams => {
    switch (range) {
      case '24h':
        return { period: 'day' };
      case '7d':
        return { period: 'week' };
      case '30d':
        return { period: 'month' };
      case '90d':
        return { period: 'month', startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() };
      case '12m':
        return { period: 'year' };
      default:
        return { period: 'week' };
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = getPeriodParams(dateRange);
      const dateParams = params.startDate ? { startDate: params.startDate, endDate: params.endDate } : {};

      const [sales, payments, clients, products, aging, traffic] = await Promise.allSettled([
        analyticsService.getSalesReport(token, params),
        analyticsService.getPaymentReport(token, params),
        analyticsService.getClientReport(token, params),
        analyticsService.getProductReport(token, params),
        analyticsService.getAgingReport(token),
        analyticsService.getTrafficSources(token, dateParams),
      ]);

      setSalesData(sales.status === 'fulfilled' ? sales.value : null);
      setPaymentData(payments.status === 'fulfilled' ? payments.value : null);
      setClientData(clients.status === 'fulfilled' ? clients.value : null);
      setProductData(products.status === 'fulfilled' ? products.value : null);
      setAgingData(aging.status === 'fulfilled' ? aging.value : null);
      setTrafficData(traffic.status === 'fulfilled' ? traffic.value : null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('حدث خطأ أثناء جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== initialDateRange) {
      fetchData();
    }
  }, [dateRange]);

  const getAnalyticsCards = (): AnalyticsCard[] => {
    const totalSales = salesData?.totalSales || 0;
    const averageInvoice = salesData?.averageInvoice || 0;
    const activeClients = clientData?.activeClients || 0;
    const conversionRate = clientData?.totalClients
      ? ((activeClients / clientData.totalClients) * 100).toFixed(1)
      : '0.0';

    return [
      {
        title: "Chiffre d'affaires",
        value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(totalSales),
        change: 12.5,
        trend: 'up',
        icon: DollarSign,
        color: 'emerald',
        href: '/dashboard/analytics/kpi',
      },
      {
        title: 'Clients actifs',
        value: activeClients,
        change: 8.2,
        trend: 'up',
        icon: Users,
        color: 'blue',
        href: '/dashboard/analytics/kpi',
      },
      {
        title: 'Taux de conversion',
        value: `${conversionRate}%`,
        change: 0.8,
        trend: 'up',
        icon: MousePointerClick,
        color: 'purple',
        href: '/dashboard/analytics/kpi',
      },
      {
        title: 'Panier moyen',
        value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(averageInvoice),
        change: 5.2,
        trend: 'up',
        icon: ShoppingCart,
        color: 'amber',
        href: '/dashboard/analytics/kpi',
      },
    ];
  };

  const getRecentActivities = (): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    if (salesData?.data && salesData.data.length > 0) {
      activities.push({
        id: '1',
        type: 'sale',
        title: 'Vente récente',
        description: `${salesData.data.length} factures ce mois`,
        time: 'Ce mois',
        status: 'success',
      });
    }

    if (productData?.lowStock && productData.lowStock > 0) {
      activities.push({
        id: '2',
        type: 'alert',
        title: 'Stock critique',
        description: `${productData.lowStock} produit(s) en stock bas`,
        time: 'Maintenant',
        status: 'warning',
      });
    }

    if (clientData?.newClients && clientData.newClients > 0) {
      activities.push({
        id: '3',
        type: 'user',
        title: 'Nouveaux clients',
        description: `${clientData.newClients} inscriptions récentes`,
        time: 'Cette semaine',
        status: 'info',
      });
    }

    return activities;
  };

  const getQuickStats = (): QuickStat[] => {
    return [
      {
        label: "Factures aujourd'hui",
        value: paymentData?.totalPayments || 0,
        change: 8,
      },
      {
        label: 'Total dû',
        value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(agingData?.totalDue || 0),
        change: -3,
      },
      {
        label: 'Taux de recouvrement',
        value: salesData
          ? `${Math.round(
              (salesData.totalInvoices > 0 ? (paymentData?.totalAmount || 0) / salesData.totalSales : 0) * 100
            )}%`
          : '0%',
        change: -5,
      },
      {
        label: 'Produits en stock',
        value: productData?.totalProducts || 0,
        change: 12,
      },
    ];
  };

  const analyticsCards = getAnalyticsCards();
  const recentActivities = getRecentActivities();
  const quickStats = getQuickStats();

  // تحويل بيانات TrafficSourceReportData إلى الشكل المناسب للعرض
  const trafficSources: TrafficSource[] = trafficData?.data?.length
    ? trafficData.data.map((item) => ({
        source: item.source,
        percentage: item.percentage,
        change: item.change,
        color: item.color,
      }))
    : [
        { source: 'Recherche organique', percentage: 45, change: 5, color: 'emerald' },
        { source: 'Direct', percentage: 25, change: -2, color: 'blue' },
        { source: 'Réseaux sociaux', percentage: 18, change: 8, color: 'purple' },
        { source: 'Email', percentage: 7, change: -1, color: 'amber' },
        { source: 'Référencement', percentage: 5, change: 3, color: 'rose' },
      ];

  const topProducts: TopProduct[] =
    productData?.topProducts?.slice(0, 3).map((p: TopProductItem) => ({
      name: p.productName,
      revenue: p.revenue,
      sales: p.quantitySold,
      growth: 15,
    })) || [];

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = async () => {
    try {
      await analyticsService.exportReport(token, 'sales', 'excel');
      alert('تم تصدير التقرير بنجاح');
    } catch (err) {
      alert('فشل تصدير التقرير');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={14} className="text-emerald-500" />;
      case 'warning':
        return <AlertCircle size={14} className="text-amber-500" />;
      default:
        return <Activity size={14} className="text-blue-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart size={14} />;
      case 'user':
        return <Users size={14} />;
      case 'product':
        return <Package size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const chartData = salesData?.data || [];
  const maxChartValue = Math.max(...chartData.map((d) => d.sales), 1);

  if (isLoading && !salesData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-[var(--foreground-muted)]">Chargement des données analytiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
          <p className="text-[var(--foreground-muted)] mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 rounded-xl">
                <TrendingUp size={24} className="text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                    VELORA • ANALYTICS
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                    ● DASHBOARD
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Tableau de bord <span className="text-indigo-500">Analytique</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono">
                  Visualisez et analysez les performances de votre entreprise
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500/50"
            >
              <option value="24h">Dernières 24 heures</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="12m">12 derniers mois</option>
            </select>
            <button
              onClick={handleRefresh}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-indigo-500/50 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-indigo-500/50 transition-colors"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
          {[
            { id: 'overview', label: "Vue d'ensemble", icon: Activity },
            { id: 'revenue', label: 'Revenus', icon: DollarSign },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'products', label: 'Produits', icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedView === tab.id
                    ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30'
                    : 'hover:bg-[var(--accent)]/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {analyticsCards.map((card) => {
            const Icon = card.icon;
            const colorClasses: Record<string, string> = {
              emerald: 'bg-emerald-500/10 text-emerald-500',
              blue: 'bg-blue-500/10 text-blue-500',
              purple: 'bg-purple-500/10 text-purple-500',
              amber: 'bg-amber-500/10 text-amber-500',
            };
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-xl ${colorClasses[card.color]} group-hover:scale-110 transition-transform`}
                  >
                    <Icon size={18} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      card.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {card.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {card.change}%
                  </div>
                </div>
                <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-black mt-1">{card.value}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Voir détails</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
              <p className="text-[10px] text-[var(--foreground-muted)]">{stat.label}</p>
              <p className="text-lg font-black">{stat.value}</p>
              <p className={`text-[10px] ${stat.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.change >= 0 ? '+' : ''}{stat.change}%
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-500" />
                  Évolution des performances
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">Comparaison mensuelle</p>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-500">CA</button>
                <button className="px-2 py-1 text-xs rounded-lg hover:bg-[var(--accent)]/10 transition-colors">
                  Commandes
                </button>
                <button className="px-2 py-1 text-xs rounded-lg hover:bg-[var(--accent)]/10 transition-colors">
                  Visiteurs
                </button>
              </div>
            </div>

            <div className="h-64 flex items-end gap-2 mt-8">
              {chartData.length > 0 ? (
                chartData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-lg transition-all hover:from-indigo-400 hover:to-indigo-300"
                      style={{ height: `${(item.sales / maxChartValue) * 180}px` }}
                    />
                    <span className="text-[10px] text-[var(--foreground-muted)]">
                      {item.date
                        ? new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' })
                        : index + 1}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center w-full text-[var(--foreground-muted)]">
                  Aucune donnée pour cette période
                </p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Activity size={18} className="text-indigo-500" />
              Activités récentes
            </h3>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/10">{getTypeIcon(activity.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {getStatusIcon(activity.status)}
                      </div>
                      <p className="text-[10px] text-[var(--foreground-muted)]">{activity.description}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)] mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[var(--foreground-muted)]">Aucune activité récente</p>
              )}
            </div>
            <Link
              href="/dashboard/analytics/kpi"
              className="mt-4 flex items-center justify-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Voir toutes les activités
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Globe size={18} className="text-blue-500" />
              Sources de trafic
            </h3>
            <div className="space-y-4">
              {trafficSources.map((source, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{source.source}</span>
                    <span className="font-medium">{source.percentage}%</span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r from-${source.color}-500 to-${source.color}-400 rounded-full`}
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${source.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {source.change >= 0 ? '+' : ''}
                    {source.change}% vs période précédente
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Package size={18} className="text-purple-500" />
              Top produits
            </h3>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--accent)]/5 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">{product.sales} ventes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-500">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(
                          product.revenue
                        )}
                      </p>
                      <p className={`text-[10px] ${product.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {product.growth >= 0 ? '+' : ''}
                        {product.growth}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[var(--foreground-muted)]">Aucun produit trouvé</p>
              )}
            </div>
            <Link
              href="/dashboard/analytics/kpi"
              className="mt-4 flex items-center justify-center gap-1 text-xs text-purple-500 hover:text-purple-400 transition-colors"
            >
              Voir tous les produits
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/dashboard/analytics/kpi"
            className="group bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/30 rounded-2xl p-6 hover:scale-105 transition-transform"
          >
            <div className="p-3 bg-indigo-500/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Target size={24} className="text-indigo-500" />
            </div>
            <h3 className="text-lg font-black mb-2">KPI Dashboard</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Suivez vos indicateurs clés de performance en temps réel
            </p>
          </Link>

          <Link
            href="/dashboard/analytics/forecast"
            className="group bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-6 hover:scale-105 transition-transform"
          >
            <div className="p-3 bg-emerald-500/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <ChartLine size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-black mb-2">Prévisions</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Prédictions basées sur l'IA et analyses avancées
            </p>
          </Link>

          <Link
            href="/dashboard/analytics/benchmark"
            className="group bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-transform"
          >
            <div className="p-3 bg-purple-500/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <PieChart size={24} className="text-purple-500" />
            </div>
            <h3 className="text-lg font-black mb-2">Benchmarking</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Comparez vos performances au marché
            </p>
          </Link>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card-bg)] p-6 rounded-2xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
              <span className="text-sm">Mise à jour des données...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}