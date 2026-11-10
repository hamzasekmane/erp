'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Award,
  Target,
  Trophy,
  Medal,
  Star,
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
  Zap,
  Brain,
  Globe,
  ArrowRight
} from 'lucide-react';

interface BenchmarkMetric {
  id: string;
  name: string;
  yourValue: number;
  industryAvg: number;
  topPerformers: number;
  unit: string;
  trend: 'up' | 'down';
  change: number;
  category: string;
}

interface IndustryData {
  name: string;
  size: string;
  growth: number;
  metrics: {
    revenue: number;
    users: number;
    conversion: number;
    retention: number;
  };
}

interface CompetitorData {
  name: string;
  logo: string;
  marketShare: number;
  growth: number;
  strengths: string[];
  weaknesses: string[];
}

export default function BenchmarkingPage() {
  const [selectedIndustry, setSelectedIndustry] = useState('tech');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comparePeriod, setComparePeriod] = useState('month');

  // Benchmark metrics data
  const benchmarkMetrics: BenchmarkMetric[] = [
    {
      id: 'revenue',
      name: 'Chiffre d\'affaires',
      yourValue: 245800,
      industryAvg: 189000,
      topPerformers: 320000,
      unit: '€',
      trend: 'up',
      change: 12.5,
      category: 'financial'
    },
    {
      id: 'users',
      name: 'Utilisateurs actifs',
      yourValue: 1842,
      industryAvg: 1250,
      topPerformers: 2800,
      unit: 'users',
      trend: 'up',
      change: 8.2,
      category: 'growth'
    },
    {
      id: 'conversion',
      name: 'Taux de conversion',
      yourValue: 3.24,
      industryAvg: 2.8,
      topPerformers: 4.5,
      unit: '%',
      trend: 'up',
      change: 0.8,
      category: 'performance'
    },
    {
      id: 'retention',
      name: 'Taux de rétention',
      yourValue: 78.5,
      industryAvg: 72.0,
      topPerformers: 85.0,
      unit: '%',
      trend: 'up',
      change: 3.2,
      category: 'customer'
    },
    {
      id: 'responseTime',
      name: 'Temps de réponse',
      yourValue: 1.2,
      industryAvg: 2.5,
      topPerformers: 0.8,
      unit: 's',
      trend: 'down',
      change: -0.3,
      category: 'operational'
    },
    {
      id: 'satisfaction',
      name: 'Satisfaction client',
      yourValue: 4.8,
      industryAvg: 4.2,
      topPerformers: 4.9,
      unit: '/5',
      trend: 'up',
      change: 0.2,
      category: 'customer'
    },
    {
      id: 'caPerUser',
      name: 'CA par utilisateur',
      yourValue: 133.5,
      industryAvg: 151.2,
      topPerformers: 180.0,
      unit: '€',
      trend: 'down',
      change: -2.1,
      category: 'financial'
    },
    {
      id: 'supportTickets',
      name: 'Tickets support',
      yourValue: 42,
      industryAvg: 68,
      topPerformers: 35,
      unit: 'tickets',
      trend: 'down',
      change: -15.0,
      category: 'operational'
    }
  ];

  // Industry data
  const industries = [
    { id: 'tech', name: 'Technologie', size: 'Grande entreprise', growth: 15.2 },
    { id: 'ecommerce', name: 'E-commerce', size: 'PME', growth: 18.5 },
    { id: 'saas', name: 'SaaS', size: 'Startup', growth: 22.3 },
    { id: 'retail', name: 'Retail', size: 'Grande entreprise', growth: 8.7 }
  ];

  // Competitor data
  const competitors: CompetitorData[] = [
    {
      name: 'TechCorp',
      logo: 'TC',
      marketShare: 28,
      growth: 15.2,
      strengths: ['Innovation', 'Marketing', 'Support'],
      weaknesses: ['Prix élevés', 'Service client lent']
    },
    {
      name: 'InnovateCo',
      logo: 'IC',
      marketShare: 22,
      growth: 22.5,
      strengths: ['Prix compétitifs', 'Rapidité', 'Interface'],
      weaknesses: ['Fonctionnalités limitées']
    },
    {
      name: 'GlobalSoft',
      logo: 'GS',
      marketShare: 18,
      growth: 8.3,
      strengths: ['Présence mondiale', 'Support 24/7'],
      weaknesses: ['Complexité', 'Coûts cachés']
    }
  ];

  // Industry specific data
  const industryData: Record<string, IndustryData> = {
    tech: {
      name: 'Technologie',
      size: 'Grande entreprise',
      growth: 15.2,
      metrics: {
        revenue: 245800,
        users: 1842,
        conversion: 3.24,
        retention: 78.5
      }
    },
    ecommerce: {
      name: 'E-commerce',
      size: 'PME',
      growth: 18.5,
      metrics: {
        revenue: 189000,
        users: 1250,
        conversion: 2.8,
        retention: 72.0
      }
    },
    saas: {
      name: 'SaaS',
      size: 'Startup',
      growth: 22.3,
      metrics: {
        revenue: 210000,
        users: 1500,
        conversion: 3.5,
        retention: 80.0
      }
    },
    retail: {
      name: 'Retail',
      size: 'Grande entreprise',
      growth: 8.7,
      metrics: {
        revenue: 320000,
        users: 2800,
        conversion: 4.5,
        retention: 85.0
      }
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '€') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    }
    if (unit === '%') {
      return `${value}%`;
    }
    if (unit === 's') {
      return `${value}s`;
    }
    if (unit === '/5') {
      return `${value}/5`;
    }
    if (value > 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toLocaleString();
  };

  const getPerformanceScore = (yourValue: number, industryAvg: number, topPerformers: number) => {
    const percentage = ((yourValue - industryAvg) / (topPerformers - industryAvg)) * 100;
    if (percentage >= 80) return { label: 'Excellent', color: 'emerald', icon: Trophy };
    if (percentage >= 60) return { label: 'Bon', color: 'blue', icon: Medal };
    if (percentage >= 40) return { label: 'Moyen', color: 'amber', icon: Star };
    return { label: 'À améliorer', color: 'red', icon: Target };
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    alert('Export des données de benchmarking en cours...');
  };

  const filteredMetrics = benchmarkMetrics;

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
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl">
                <Target size={20} className="text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                    VELORA • ANALYTICS
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    ● BENCHMARK
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Benchmarking & <span className="text-amber-500">Performance</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono">
                  Comparez vos performances aux standards de l'industrie
                </p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-amber-500/50"
            >
              {industries.map((ind) => (
                <option key={ind.id} value={ind.id}>{ind.name}</option>
              ))}
            </select>
            <select
              value={comparePeriod}
              onChange={(e) => setComparePeriod(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois-ci</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            <button
              onClick={handleRefresh}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-amber-500/50 transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-amber-500/50 transition-colors"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Industry Overview Card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Building2 size={24} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">Secteur d'activité</p>
                <h3 className="text-2xl font-black">{industryData[selectedIndustry].name}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{industryData[selectedIndustry].size}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Croissance du secteur</p>
                <p className="text-2xl font-black text-emerald-500">+{industryData[selectedIndustry].growth}%</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Votre position</p>
                <p className="text-2xl font-black text-amber-500">Top 15%</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Score global</p>
                <p className="text-2xl font-black text-blue-500">82/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmark Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMetrics.map((metric) => {
            const performance = getPerformanceScore(metric.yourValue, metric.industryAvg, metric.topPerformers);
            const PerformanceIcon = performance.icon;
            const isPositiveMetric = metric.trend === 'up';
            const percentageVsAvg = ((metric.yourValue - metric.industryAvg) / metric.industryAvg) * 100;
            
            return (
              <div
                key={metric.id}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-amber-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black">{metric.name}</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">Catégorie: {metric.category}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${performance.color}-500/20 text-${performance.color}-500`}>
                    <PerformanceIcon size={12} />
                    {performance.label}
                  </div>
                </div>

                {/* Values */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Votre valeur</p>
                    <p className="text-xl font-black text-amber-500">{formatValue(metric.yourValue, metric.unit)}</p>
                    <div className={`flex items-center gap-1 text-xs ${metric.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {metric.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Moyenne secteur</p>
                    <p className="text-xl font-black">{formatValue(metric.industryAvg, metric.unit)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Top performeurs</p>
                    <p className="text-xl font-black text-emerald-500">{formatValue(metric.topPerformers, metric.unit)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Votre performance</span>
                    <span className={`font-medium ${percentageVsAvg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {percentageVsAvg >= 0 ? '+' : ''}{percentageVsAvg.toFixed(1)}% vs secteur
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, (metric.yourValue / metric.topPerformers) * 100))}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--foreground-muted)]">
                    <span>0</span>
                    <span>Objectif: {formatValue(metric.topPerformers, metric.unit)}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedMetric === metric.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-[var(--foreground-muted)]">Recommandations</p>
                        <ul className="mt-2 space-y-1">
                          {percentageVsAvg < 0 ? (
                            <>
                              <li className="text-xs flex items-center gap-2">
                                <Target size={12} className="text-amber-500" />
                                Augmenter de {Math.abs(percentageVsAvg).toFixed(0)}% pour atteindre la moyenne
                              </li>
                              <li className="text-xs flex items-center gap-2">
                                <Zap size={12} className="text-blue-500" />
                                Optimiser les processus
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="text-xs flex items-center gap-2">
                                <CheckCircle size={12} className="text-emerald-500" />
                                Performance supérieure à la moyenne
                              </li>
                              <li className="text-xs flex items-center gap-2">
                                <Target size={12} className="text-amber-500" />
                                Visez le top 10% du secteur
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--foreground-muted)]">Insights</p>
                        <div className="mt-2 p-2 bg-[var(--accent)]/5 rounded-lg">
                          <p className="text-xs">
                            {metric.yourValue > metric.industryAvg 
                              ? `Vous êtes ${percentageVsAvg.toFixed(1)}% au-dessus de la moyenne du secteur. Continuez sur cette lancée !`
                              : `Vous êtes ${Math.abs(percentageVsAvg).toFixed(1)}% en dessous de la moyenne. Concentrez-vous sur l'amélioration de ce KPI.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Competitor Analysis */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-lg font-black flex items-center gap-2 mb-4">
            <Globe size={18} className="text-purple-500" />
            Analyse concurrentielle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {competitors.map((competitor, index) => (
              <div key={index} className="p-4 rounded-xl border border-[var(--border)] hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center font-black">
                    {competitor.logo}
                  </div>
                  <div>
                    <h4 className="font-black">{competitor.name}</h4>
                    <p className="text-[10px] text-[var(--foreground-muted)]">
                      Part de marché: {competitor.marketShare}%
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Croissance</span>
                    <span className={competitor.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                      {competitor.growth >= 0 ? '+' : ''}{competitor.growth}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-1">Forces</p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.strengths.map((strength, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-1">Faiblesses</p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.weaknesses.map((weakness, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                          {weakness}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Brain size={24} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-black mb-2">Recommandations stratégiques</h3>
              <p className="text-sm text-[var(--foreground-muted)] mb-4">
                Basé sur l'analyse comparative, voici les actions prioritaires pour améliorer vos performances:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-sm">Optimiser le taux de conversion (+15%)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5">
                  <Users size={14} className="text-blue-500" />
                  <span className="text-sm">Fidéliser les clients existants</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5">
                  <Zap size={14} className="text-blue-500" />
                  <span className="text-sm">Améliorer le support client</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5">
                  <TrendingUp size={14} className="text-blue-500" />
                  <span className="text-sm">Augmenter le panier moyen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card-bg)] p-6 rounded-2xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
              <span className="text-sm">Chargement des benchmarks...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}