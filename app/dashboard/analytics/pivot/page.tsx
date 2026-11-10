'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Grid,
  Download,
  RefreshCw,
  Filter,
  Plus,
  Trash2,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  BarChart3,
  PieChart,
  Eye
} from 'lucide-react';

interface PivotData {
  rows: string[];
  columns: string[];
  values: {
    [key: string]: {
      [key: string]: number;
    };
  };
  totals: {
    rows: { [key: string]: number };
    columns: { [key: string]: number };
    grand: number;
  };
}

interface PivotConfig {
  id: string;
  name: string;
  rows: string[];
  columns: string[];
  values: string[];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  dateRange: string;
}

export default function PivotTablesPage() {
  const [selectedConfig, setSelectedConfig] = useState('sales');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Pivot configurations
  const pivotConfigs: PivotConfig[] = [
    {
      id: 'sales',
      name: 'Ventes par produit et région',
      rows: ['product', 'region'],
      columns: ['quarter'],
      values: ['revenue', 'quantity'],
      aggregation: 'sum',
      dateRange: '2024'
    },
    {
      id: 'customers',
      name: 'Clients par segment et statut',
      rows: ['segment', 'status'],
      columns: ['month'],
      values: ['count', 'revenue'],
      aggregation: 'sum',
      dateRange: '2024'
    },
    {
      id: 'products',
      name: 'Performance produits',
      rows: ['category', 'product'],
      columns: ['month'],
      values: ['sales', 'profit'],
      aggregation: 'sum',
      dateRange: '2024'
    }
  ];

  // Mock pivot data
  const pivotData: PivotData = {
    rows: ['Produit A', 'Produit B', 'Produit C', 'Total'],
    columns: ['T1', 'T2', 'T3', 'T4', 'Total'],
    values: {
      'Produit A': { 'T1': 12500, 'T2': 13800, 'T3': 14200, 'T4': 15600, 'Total': 56100 },
      'Produit B': { 'T1': 8900, 'T2': 9500, 'T3': 10200, 'T4': 11800, 'Total': 40400 },
      'Produit C': { 'T1': 4500, 'T2': 5200, 'T3': 5800, 'T4': 6200, 'Total': 21700 },
      'Total': { 'T1': 25900, 'T2': 28500, 'T3': 30200, 'T4': 33600, 'Total': 118200 }
    },
    totals: {
      rows: { 'Produit A': 56100, 'Produit B': 40400, 'Produit C': 21700, 'Total': 118200 },
      columns: { 'T1': 25900, 'T2': 28500, 'T3': 30200, 'T4': 33600, 'Total': 118200 },
      grand: 118200
    }
  };

  // Available dimensions and measures
  const dimensions = [
    { id: 'product', name: 'Produit', type: 'dimension' },
    { id: 'region', name: 'Région', type: 'dimension' },
    { id: 'segment', name: 'Segment client', type: 'dimension' },
    { id: 'status', name: 'Statut', type: 'dimension' },
    { id: 'category', name: 'Catégorie', type: 'dimension' },
    { id: 'month', name: 'Mois', type: 'dimension' },
    { id: 'quarter', name: 'Trimestre', type: 'dimension' },
    { id: 'year', name: 'Année', type: 'dimension' }
  ];

  const measures = [
    { id: 'revenue', name: 'Chiffre d\'affaires', type: 'measure', format: 'currency' },
    { id: 'quantity', name: 'Quantité', type: 'measure', format: 'number' },
    { id: 'count', name: 'Nombre', type: 'measure', format: 'number' },
    { id: 'profit', name: 'Profit', type: 'measure', format: 'currency' },
    { id: 'margin', name: 'Marge', type: 'measure', format: 'percentage' }
  ];

  const formatValue = (value: number, format: string = 'currency') => {
    if (format === 'currency') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    }
    if (format === 'percentage') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    alert('Export du tableau croisé en cours...');
  };

  const toggleRowExpand = (row: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(row)) {
      newExpanded.delete(row);
    } else {
      newExpanded.add(row);
    }
    setExpandedRows(newExpanded);
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
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-xl">
                <Grid size={20} className="text-cyan-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">
                    VELORA • ANALYTICS
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-500 border border-cyan-500/30">
                    ● PIVOT
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Tableaux <span className="text-cyan-500">Croisés</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono">
                  Analyse multidimensionnelle de vos données
                </p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Settings size={16} />
              Nouvelle analyse
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-cyan-500/50 transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-cyan-500/50 transition-colors"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Configuration Selector */}
        <div className="flex flex-wrap gap-2 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <span className="text-xs font-medium text-[var(--foreground-muted)] self-center">Analyses sauvegardées:</span>
          {pivotConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setSelectedConfig(config.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                selectedConfig === config.id
                  ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30'
                  : 'hover:bg-[var(--accent)]/5'
              }`}
            >
              {config.name}
            </button>
          ))}
        </div>

        {/* Pivot Table */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <BarChart3 size={18} className="text-cyan-500" />
                  {pivotConfigs.find(c => c.id === selectedConfig)?.name}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Données {pivotConfigs.find(c => c.id === selectedConfig)?.dateRange}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-500">
                  Lignes: {pivotConfigs.find(c => c.id === selectedConfig)?.rows.join(', ')}
                </span>
                <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-500">
                  Colonnes: {pivotConfigs.find(c => c.id === selectedConfig)?.columns.join(', ')}
                </span>
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                  Agrégation: {pivotConfigs.find(c => c.id === selectedConfig)?.aggregation}
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                {/* Column headers */}
                <tr className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
                  <th className="p-4 text-left text-xs font-black uppercase tracking-wider border-r border-[var(--border)]">
                    Lignes \ Colonnes
                  </th>
                  {pivotData.columns.map((col, index) => (
                    <th key={index} className="p-4 text-center text-xs font-black uppercase tracking-wider border-r border-[var(--border)]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Data rows */}
                {pivotData.rows.map((row, rowIndex) => {
                  const isTotal = row === 'Total';
                  const isExpanded = expandedRows.has(row);
                  
                  return (
                    <tr 
                      key={rowIndex} 
                      className={`border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors ${
                        isTotal ? 'bg-cyan-500/5 font-bold' : ''
                      }`}
                    >
                      <td className="p-4 font-medium border-r border-[var(--border)]">
                        <div className="flex items-center gap-2">
                          {!isTotal && (
                            <button
                              onClick={() => toggleRowExpand(row)}
                              className="p-0.5 hover:bg-[var(--accent)]/10 rounded"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                          {row}
                        </div>
                      </td>
                      {pivotData.columns.map((col, colIndex) => {
                        const value = pivotData.values[row]?.[col] || 0;
                        const isHighlight = value > 30000;
                        
                        return (
                          <td 
                            key={colIndex} 
                            className={`p-4 text-center border-r border-[var(--border)] ${
                              isHighlight ? 'bg-emerald-500/10 text-emerald-500 font-bold' : ''
                            }`}
                          >
                            {formatValue(value, 'currency')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <h4 className="text-sm font-black">Top performance</h4>
            </div>
            <p className="text-2xl font-black text-emerald-500">+29.7%</p>
            <p className="text-xs text-[var(--foreground-muted)]">Croissance T4 vs T1</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-blue-500" />
              <h4 className="text-sm font-black">Meilleur produit</h4>
            </div>
            <p className="text-lg font-black">Produit A</p>
            <p className="text-xs text-[var(--foreground-muted)]">56,100 € de CA</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart size={16} className="text-purple-500" />
              <h4 className="text-sm font-black">Part du top produit</h4>
            </div>
            <p className="text-2xl font-black text-purple-500">47.5%</p>
            <p className="text-xs text-[var(--foreground-muted)]">du CA total</p>
          </div>
        </div>

        {/* Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">Nouvelle analyse croisée</h3>
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="p-1 hover:bg-[var(--accent)]/10 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Lignes (Dimensions)</label>
                  <div className="flex flex-wrap gap-2">
                    {dimensions.map((dim) => (
                      <button
                        key={dim.id}
                        className="px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-cyan-500/50 transition-colors"
                      >
                        {dim.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Colonnes (Dimensions)</label>
                  <div className="flex flex-wrap gap-2">
                    {dimensions.map((dim) => (
                      <button
                        key={dim.id}
                        className="px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-cyan-500/50 transition-colors"
                      >
                        {dim.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Valeurs (Mesures)</label>
                  <div className="flex flex-wrap gap-2">
                    {measures.map((measure) => (
                      <button
                        key={measure.id}
                        className="px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-emerald-500/50 transition-colors"
                      >
                        {measure.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Agrégation</label>
                  <select className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-cyan-500/50">
                    <option value="sum">Somme</option>
                    <option value="avg">Moyenne</option>
                    <option value="count">Comptage</option>
                    <option value="min">Minimum</option>
                    <option value="max">Maximum</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-[var(--border)] flex gap-3">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)]/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    alert('Analyse créée avec succès!');
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                  Générer l'analyse
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card-bg)] p-6 rounded-2xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-500 border-t-transparent"></div>
              <span className="text-sm">Chargement...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}