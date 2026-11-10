'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Activity,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  MousePointerClick,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  Award,
  Globe,
  Smartphone,
  Monitor,
  Filter
} from 'lucide-react';

interface KpiCard {
  id: string;
  title: string;
  value: number; // Changed from string | number to number
  change: number;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  format: 'currency' | 'number' | 'percentage' | 'time';
}

interface ChartData {
  labels: string[];
  datasets: {
    revenue: number[];
    orders: number[];
    users: number[];
  };
}

export default function KpiDashboardPage() {
  const [dateRange, setDateRange] = useState('month');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);

  // KPI Cards Data - All values are numbers now
  const kpiCards: KpiCard[] = [
    {
      id: 'revenue',
      title: 'Chiffre d\'affaires',
      value: 245800,
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'emerald',
      format: 'currency'
    },
    {
      id: 'users',
      title: 'Utilisateurs actifs',
      value: 1842,
      change: 8.2,
      trend: 'up',
      icon: Users,
      color: 'blue',
      format: 'number'
    },
    {
      id: 'orders',
      title: 'Commandes',
      value: 1256,
      change: -2.4,
      trend: 'down',
      icon: ShoppingCart,
      color: 'purple',
      format: 'number'
    },
    {
      id: 'conversion',
      title: 'Taux de conversion',
      value: 3.24,
      change: 0.8,
      trend: 'up',
      icon: MousePointerClick,
      color: 'amber',
      format: 'percentage'
    },
    {
      id: 'avgOrder',
      title: 'Panier moyen',
      value: 195.50,
      change: 5.2,
      trend: 'up',
      icon: Package,
      color: 'rose',
      format: 'currency'
    },
    {
      id: 'responseTime',
      title: 'Temps de réponse',
      value: 1.2,
      change: -0.3,
      trend: 'down',
      icon: Clock,
      color: 'cyan',
      format: 'time'
    },
    {
      id: 'satisfaction',
      title: 'Satisfaction client',
      value: 4.8,
      change: 0.2,
      trend: 'up',
      icon: Award,
      color: 'indigo',
      format: 'number'
    },
    {
      id: 'bounceRate',
      title: 'Taux de rebond',
      value: 32.5,
      change: -5.1,
      trend: 'down',
      icon: Eye,
      color: 'orange',
      format: 'percentage'
    }
  ];

  // Chart Data
  const [chartData] = useState<ChartData>({
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: {
      revenue: [18500, 19200, 20100, 21500, 22800, 24500, 26800, 28200, 30100, 32500, 34800, 37200],
      orders: [850, 890, 920, 980, 1050, 1120, 1180, 1250, 1320, 1380, 1450, 1520],
      users: [1200, 1280, 1350, 1420, 1510, 1620, 1740, 1850, 1980, 2100, 2250, 2400]
    }
  });

  // Top products data
  const topProducts = [
    { name: 'Smartphone X100', revenue: 45200, sales: 245, growth: 15 },
    { name: 'Laptop Pro', revenue: 38900, sales: 78, growth: 22 },
    { name: 'Wireless Headphones', revenue: 25600, sales: 512, growth: 8 },
    { name: 'Smart Watch', revenue: 18900, sales: 189, growth: -3 },
    { name: 'Tablet Air', revenue: 15600, sales: 67, growth: 12 }
  ];

  // Traffic sources
  const trafficSources = [
    { source: 'Recherche organique', percentage: 45, change: 5 },
    { source: 'Direct', percentage: 25, change: -2 },
    { source: 'Réseaux sociaux', percentage: 18, change: 8 },
    { source: 'Email', percentage: 7, change: -1 },
    { source: 'Référencement', percentage: 5, change: 3 }
  ];

  // Device distribution
  const deviceDistribution = [
    { device: 'Desktop', percentage: 52, icon: Monitor },
    { device: 'Mobile', percentage: 38, icon: Smartphone },
    { device: 'Tablet', percentage: 10, icon: Smartphone }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'time':
        return `${value}s`;
      default:
        return value.toLocaleString();
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
      rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30' },
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30' },
      indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/30' },
      orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' }
    };
    return colors[color] || colors.blue;
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    alert('Export des données KPI en cours...');
  };

  // Helper function to safely get KPI value
  const getKpiValue = (kpi: KpiCard) => {
    return formatValue(kpi.value, kpi.format);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/analytics"
                className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
              >
                <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
              </Link>
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl">
                <Activity size={20} className="text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                    VELORA • ANALYTICS
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    ● KPI DASHBOARD
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Tableau de bord <span className="text-emerald-500">KPI</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono">
                  Suivez vos indicateurs clés de performance en temps réel
                </p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois-ci</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            <button
              onClick={handleRefresh}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-emerald-500/50 transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-emerald-500/50 transition-colors"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            const colors = getColorClasses(kpi.color);
            return (
              <div
                key={kpi.id}
                className={`bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:border-${kpi.color}-500/50 transition-all cursor-pointer group`}
                onClick={() => setSelectedKpi(kpi.id === selectedKpi ? null : kpi.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 ${colors.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon size={18} className={colors.text} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {kpi.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>
                <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                  {kpi.title}
                </p>
                <p className="text-2xl font-black mt-1">{getKpiValue(kpi)}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] mt-2">
                  vs période précédente
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Chart - Takes 2/3 width */}
          <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  Évolution du chiffre d'affaires
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">Comparaison mensuelle</p>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-500">CA</button>
                <button className="px-2 py-1 text-xs rounded-lg hover:bg-[var(--accent)]/10 transition-colors">Commandes</button>
                <button className="px-2 py-1 text-xs rounded-lg hover:bg-[var(--accent)]/10 transition-colors">Utilisateurs</button>
              </div>
            </div>
            
            {/* Simple bar chart visualization */}
            <div className="h-64 flex items-end gap-2 mt-8">
              {chartData.datasets.revenue.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-lg transition-all hover:from-emerald-400 hover:to-emerald-300"
                    style={{ height: `${(value / Math.max(...chartData.datasets.revenue)) * 200}px` }}
                  />
                  <span className="text-[10px] text-[var(--foreground-muted)]">{chartData.labels[index]}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-between text-sm">
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Total</p>
                <p className="text-xl font-black text-emerald-500">
                  {formatValue(chartData.datasets.revenue.reduce((a, b) => a + b, 0), 'currency')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Moyenne mensuelle</p>
                <p className="text-xl font-black">
                  {formatValue(chartData.datasets.revenue.reduce((a, b) => a + b, 0) / 12, 'currency')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Croissance</p>
                <p className="text-xl font-black text-emerald-500">+24.5%</p>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Package size={18} className="text-purple-500" />
              Top produits
            </h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">{product.sales} ventes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatValue(product.revenue, 'currency')}</p>
                    <p className={`text-[10px] ${product.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {product.growth >= 0 ? '+' : ''}{product.growth}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${source.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {source.change >= 0 ? '+' : ''}{source.change}% vs période précédente
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Smartphone size={18} className="text-indigo-500" />
              Répartition par appareil
            </h3>
            <div className="flex justify-center items-center h-48">
              <div className="relative w-48 h-48">
                {/* Simple pie chart visualization */}
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="20" 
                    strokeDasharray={`${(52 / 100) * 283} 283`} />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="20" 
                    strokeDasharray={`${(38 / 100) * 283} 283`} strokeDashoffset={`-${(52 / 100) * 283}`} />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#8b5cf6" strokeWidth="20" 
                    strokeDasharray={`${(10 / 100) * 283} 283`} strokeDashoffset={`-${((52 + 38) / 100) * 283}`} />
                </svg>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {deviceDistribution.map((device, index) => {
                const Icon = device.icon;
                return (
                  <div key={index} className="text-center">
                    <Icon size={20} className="mx-auto mb-1 text-[var(--foreground-muted)]" />
                    <p className="text-sm font-medium">{device.device}</p>
                    <p className="text-xs text-emerald-500">{device.percentage}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KPI Details Modal */}
        {selectedKpi && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black">
                  {kpiCards.find(k => k.id === selectedKpi)?.title}
                </h3>
                <button
                  onClick={() => setSelectedKpi(null)}
                  className="p-1 hover:bg-[var(--accent)]/10 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">Valeur actuelle</p>
                  <p className="text-3xl font-black">
                    {(() => {
                      const kpi = kpiCards.find(k => k.id === selectedKpi);
                      return kpi ? formatValue(kpi.value, kpi.format) : '';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">Tendance</p>
                  <p className={`text-lg font-medium ${
                    (() => {
                      const kpi = kpiCards.find(k => k.id === selectedKpi);
                      return kpi?.trend === 'up' ? 'text-emerald-500' : 'text-red-500';
                    })()
                  }`}>
                    {(() => {
                      const kpi = kpiCards.find(k => k.id === selectedKpi);
                      return `${kpi?.change}% vs période précédente`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">Objectif</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progression</span>
                      <span>78%</span>
                    </div>
                    <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}