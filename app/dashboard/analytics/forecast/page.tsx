'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  ChartLine,
  Percent,
  DollarSign,
  Users,
  ShoppingCart,
  Package
} from 'lucide-react';

interface ForecastData {
  month: string;
  actual: number | null;
  forecast: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

interface ProductForecast {
  name: string;
  currentSales: number;
  forecastNextMonth: number;
  growth: number;
  seasonality: number;
}

interface SeasonalPattern {
  month: string;
  factor: number;
  description: string;
}

export default function ForecastPage() {
  const [forecastPeriod, setForecastPeriod] = useState(6);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Historical and forecast data
  const forecastData: ForecastData[] = [
    { month: 'Jan 2024', actual: 18500, forecast: 18500, lowerBound: 17575, upperBound: 19425, confidence: 95 },
    { month: 'Fév 2024', actual: 19200, forecast: 19200, lowerBound: 18240, upperBound: 20160, confidence: 95 },
    { month: 'Mar 2024', actual: 20100, forecast: 20100, lowerBound: 19095, upperBound: 21105, confidence: 95 },
    { month: 'Avr 2024', actual: 21500, forecast: 21500, lowerBound: 20425, upperBound: 22575, confidence: 95 },
    { month: 'Mai 2024', actual: 22800, forecast: 22800, lowerBound: 21660, upperBound: 23940, confidence: 95 },
    { month: 'Jun 2024', actual: 24500, forecast: 24500, lowerBound: 23275, upperBound: 25725, confidence: 95 },
    { month: 'Jul 2024', actual: null, forecast: 26800, lowerBound: 24800, upperBound: 28800, confidence: 90 },
    { month: 'Aoû 2024', actual: null, forecast: 28900, lowerBound: 26300, upperBound: 31500, confidence: 85 },
    { month: 'Sep 2024', actual: null, forecast: 31200, lowerBound: 27800, upperBound: 34600, confidence: 85 },
    { month: 'Oct 2024', actual: null, forecast: 33500, lowerBound: 29200, upperBound: 37800, confidence: 80 },
    { month: 'Nov 2024', actual: null, forecast: 35800, lowerBound: 30400, upperBound: 41200, confidence: 80 },
    { month: 'Déc 2024', actual: null, forecast: 38500, lowerBound: 32000, upperBound: 45000, confidence: 75 }
  ];

  // Product forecasts
  const productForecasts: ProductForecast[] = [
    { name: 'Smartphone X100', currentSales: 245, forecastNextMonth: 280, growth: 14.3, seasonality: 1.2 },
    { name: 'Laptop Pro', currentSales: 78, forecastNextMonth: 95, growth: 21.8, seasonality: 1.1 },
    { name: 'Wireless Headphones', currentSales: 512, forecastNextMonth: 550, growth: 7.4, seasonality: 1.3 },
    { name: 'Smart Watch', currentSales: 189, forecastNextMonth: 175, growth: -7.4, seasonality: 0.9 },
    { name: 'Tablet Air', currentSales: 67, forecastNextMonth: 82, growth: 22.4, seasonality: 1.15 }
  ];

  // Seasonal patterns
  const seasonalPatterns: SeasonalPattern[] = [
    { month: 'Janvier', factor: 0.85, description: 'Post-vacances, baisse d\'activité' },
    { month: 'Février', factor: 0.88, description: 'Reprise progressive' },
    { month: 'Mars', factor: 0.92, description: 'Début de saison' },
    { month: 'Avril', factor: 0.95, description: 'Activité normale' },
    { month: 'Mai', factor: 0.98, description: 'Activité normale' },
    { month: 'Juin', factor: 1.05, description: 'Préparation été' },
    { month: 'Juillet', factor: 1.15, description: 'Période estivale - Pic d\'activité' },
    { month: 'Août', factor: 1.2, description: 'Période estivale - Pic maximum' },
    { month: 'Septembre', factor: 1.1, description: 'Rentrée - Activité élevée' },
    { month: 'Octobre', factor: 1.0, description: 'Retour à la normale' },
    { month: 'Novembre', factor: 1.08, description: 'Préparation Black Friday' },
    { month: 'Décembre', factor: 1.25, description: 'Période des fêtes - Pic maximum' }
  ];

  // Key forecasting metrics
  const forecastMetrics = {
    totalForecast: forecastData.filter(f => f.actual === null).reduce((sum, f) => sum + f.forecast, 0),
    averageConfidence: forecastData.filter(f => f.actual === null).reduce((sum, f) => sum + f.confidence, 0) / forecastData.filter(f => f.actual === null).length,
    expectedGrowth: ((forecastData.find(f => f.month === 'Déc 2024')?.forecast || 0) / (forecastData.find(f => f.month === 'Jun 2024')?.actual || 1) - 1) * 100,
    mape: 8.5 // Mean Absolute Percentage Error
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-emerald-500';
    if (confidence >= 80) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleExport = () => {
    alert('Export des prévisions en cours...');
  };

  const handleRunForecast = () => {
    alert(`Génération des prévisions sur ${forecastPeriod} mois avec un niveau de confiance de ${confidenceLevel}%...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        
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
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl">
                <ChartLine size={20} className="text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                    VELORA • ANALYTICS
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/30">
                    ● FORECAST
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Prévisions & <span className="text-blue-500">Tendances</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono">
                  Prédictions basées sur l'IA et analyses avancées
                </p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <select
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(Number(e.target.value))}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value={3}>3 mois</option>
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
            </select>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value={90}>90% Confiance</option>
              <option value={95}>95% Confiance</option>
              <option value={99}>99% Confiance</option>
            </select>
            <button
              onClick={handleRunForecast}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Brain size={16} />
              Générer prévisions
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-blue-500/50 transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-blue-500/50 transition-colors"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Forecast Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={16} className="text-blue-500" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">FORECAST</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">CA prévisionnel</p>
            <p className="text-2xl font-black text-blue-500">{formatCurrency(forecastMetrics.totalForecast)}</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Sur les 6 prochains mois</p>
          </div>
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Percent size={16} className="text-emerald-500" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">GROWTH</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Croissance attendue</p>
            <p className="text-2xl font-black text-emerald-500">+{forecastMetrics.expectedGrowth.toFixed(1)}%</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">vs période précédente</p>
          </div>
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Target size={16} className="text-purple-500" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">CONFIDENCE</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Niveau de confiance</p>
            <p className="text-2xl font-black text-purple-500">{forecastMetrics.averageConfidence.toFixed(0)}%</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Moyenne des prévisions</p>
          </div>
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Activity size={16} className="text-amber-500" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">ACCURACY</span>
            </div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Précision MAPE</p>
            <p className="text-2xl font-black text-amber-500">{forecastMetrics.mape}%</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Erreur moyenne</p>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <ChartLine size={18} className="text-blue-500" />
                Projection du chiffre d'affaires
              </h3>
              <p className="text-xs text-[var(--foreground-muted)]">Prévisions avec intervalles de confiance</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>Données réelles</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Prévision</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500/20 rounded-full"></div>
                <span>Intervalle de confiance</span>
              </div>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="relative h-96 mt-4">
            <div className="absolute inset-0 flex items-end gap-2">
              {forecastData.slice(0, forecastPeriod + 6).map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                  {/* Confidence interval bar (background) */}
                  <div 
                    className="w-full bg-blue-500/20 rounded-lg relative"
                    style={{ 
                      height: `${((data.upperBound - data.lowerBound) / 40000) * 100}%`,
                      minHeight: '4px'
                    }}
                  >
                    {/* Actual/Forecast bar */}
                    <div 
                      className={`absolute bottom-0 left-0 right-0 rounded-lg transition-all ${
                        data.actual !== null ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ 
                        height: `${((data.actual || data.forecast) / 40000) * 100}%`,
                        minHeight: '2px'
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--foreground-muted)] rotate-45 origin-left whitespace-nowrap">
                    {data.month.split(' ')[0]}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    <p className="text-xs font-medium">{data.month}</p>
                    <p className="text-[10px] text-emerald-500">
                      {data.actual !== null ? `Réel: ${formatCurrency(data.actual)}` : `Prévision: ${formatCurrency(data.forecast)}`}
                    </p>
                    <p className="text-[10px] text-blue-500">
                      Intervalle: {formatCurrency(data.lowerBound)} - {formatCurrency(data.upperBound)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-[var(--border)] flex justify-between text-sm">
            <div>
              <p className="text-[10px] text-[var(--foreground-muted)]">Tendance</p>
              <p className="text-base font-black text-emerald-500 flex items-center gap-1">
                <TrendingUp size={14} />
                Croissance positive
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--foreground-muted)]">Pic saisonnier</p>
              <p className="text-base font-black">Décembre (+25%)</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--foreground-muted)]">Modèle utilisé</p>
              <p className="text-base font-black">SARIMA + ML</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Product Forecasts */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Package size={18} className="text-purple-500" />
              Prévisions par produit
            </h3>
            <div className="space-y-4">
              {productForecasts.map((product, index) => (
                <div 
                  key={index} 
                  className="p-3 rounded-xl border border-[var(--border)] hover:border-purple-500/50 transition-all cursor-pointer"
                  onClick={() => setShowDetails(showDetails === product.name ? null : product.name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">
                        Ventes actuelles: {product.currentSales} unités
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-500">
                        {product.forecastNextMonth} unités
                      </p>
                      <p className={`text-[10px] ${product.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {product.growth >= 0 ? '+' : ''}{product.growth}%
                      </p>
                    </div>
                  </div>
                  
                  {showDetails === product.name && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                      <div>
                        <p className="text-[10px] text-[var(--foreground-muted)]">Facteur saisonnier</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${(product.seasonality / 1.5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{product.seasonality}x</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--foreground-muted)]">
                        Recommandation: {product.growth >= 0 ? 'Augmenter les stocks de 20%' : 'Réduire les stocks de 15%'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seasonal Patterns */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-amber-500" />
              Patterns saisonniers
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {seasonalPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)]/5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pattern.month}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                        {pattern.factor > 1 ? 'Pic' : pattern.factor < 1 ? 'Creux' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--foreground-muted)]">{pattern.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-amber-500">{pattern.factor}x</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">
                      {pattern.factor > 1 ? `+${((pattern.factor - 1) * 100).toFixed(0)}%` : `${((pattern.factor - 1) * 100).toFixed(0)}%`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forecasting Methodology */}
        <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Brain size={24} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-black mb-2">Méthodologie de prévision</h3>
              <p className="text-sm text-[var(--foreground-muted)] mb-3">
                Nos prévisions utilisent une combinaison de modèles SARIMA (Seasonal ARIMA) 
                et d'algorithmes de Machine Learning pour analyser les tendances historiques, 
                les patterns saisonniers et les facteurs externes.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-xs">Précision de 91.5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-xs">Mise à jour quotidienne</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-xs">Adaptation temps réel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card-bg)] p-6 rounded-2xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm">Génération des prévisions...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}