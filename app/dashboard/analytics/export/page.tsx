'use client';

import { useState } from 'react';
import { exportAnalyticsData } from '@/app/actions/analytics.actions';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileArchive,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Settings,
  Mail,
  History,
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  DollarSign
} from 'lucide-react';

interface ExportFormat {
  id: string;
  name: string;
  icon: React.ElementType;
  extension: string;
  description: string;
}

interface ExportJob {
  id: string;
  name: string;
  type: string;
  format: string;
  status: 'completed' | 'pending' | 'failed';
  size: string;
  createdAt: string;
  downloadUrl?: string;
}

export default function DataExportPage() {
  const [selectedDataType, setSelectedDataType] = useState('sales');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('last30days');
  const [isExporting, setIsExporting] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [scheduleExport, setScheduleExport] = useState(false);
  const [emailNotification, setEmailNotification] = useState(true);

  // Data types available for export
  const dataTypes = [
    { id: 'sales', name: 'Ventes', icon: ShoppingCart },
    { id: 'clients', name: 'Clients', icon: Users },
    { id: 'products', name: 'Produits', icon: Package },
    { id: 'payments', name: 'Paiements', icon: DollarSign },
    { id: 'aging', name: 'Créances', icon: BarChart3 }
  ];

  // Export formats — the API currently generates CSV exports only.
  const exportFormats: ExportFormat[] = [
    { id: 'csv', name: 'CSV', icon: FileText, extension: '.csv', description: 'Compatible avec tous les tableurs' }
  ];

  // Export history
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportAnalyticsData(selectedDataType, dateRange);
      if (!result.success || !result.data) {
        alert(result.message || "Export impossible");
        return;
      }

      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename || "export.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      const formatName = exportFormats.find(f => f.id === selectedFormat)?.name ?? "CSV";
      setExportHistory(prev => [{
        id: String(Date.now()),
        name: result.filename || "export.csv",
        type: dataTypes.find(d => d.id === selectedDataType)?.name ?? "Ventes",
        format: formatName,
        status: 'completed' as const,
        size: `${Math.max(1, Math.round(blob.size / 1024))} KB`,
        createdAt: new Date().toLocaleString('fr-FR'),
        downloadUrl: '#',
      }, ...prev]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Export impossible");
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleExport = () => {
    alert("La planification automatique des exports n'est pas encore disponible.");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'pending':
        return <Clock size={16} className="text-amber-500" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
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
              <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl">
                <Download size={20} className="text-green-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
                    VELORA • ANALYTICS
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
                    ● EXPORT
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Export de <span className="text-green-500">Données</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono">
                  Exportez vos données dans différents formats
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Export Configuration - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Data Type Selection */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-lg font-black mb-4">1. Sélectionnez les données à exporter</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dataTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedDataType(type.id)}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        selectedDataType === type.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-[var(--border)] hover:border-green-500/50'
                      }`}
                    >
                      <Icon size={20} className={selectedDataType === type.id ? 'text-green-500' : 'text-[var(--foreground-muted)]'} />
                      <p className="text-sm font-medium mt-2">{type.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format Selection */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-lg font-black mb-4">2. Choisissez le format d'export</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {exportFormats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 rounded-xl border transition-all text-center ${
                        selectedFormat === format.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-[var(--border)] hover:border-green-500/50'
                      }`}
                    >
                      <Icon size={24} className={`mx-auto ${selectedFormat === format.id ? 'text-green-500' : 'text-[var(--foreground-muted)]'}`} />
                      <p className="text-sm font-medium mt-2">{format.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">{format.extension}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-lg font-black mb-4">3. Options d'export</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Période</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-green-500/50"
                  >
                    <option value="today">Aujourd'hui</option>
                    <option value="yesterday">Hier</option>
                    <option value="last7days">7 derniers jours</option>
                    <option value="last30days">30 derniers jours</option>
                    <option value="last90days">90 derniers jours</option>
                    <option value="last12months">12 derniers mois</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">Inclure les graphiques</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Ajouter des visualisations dans l'export</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">Export programmé</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Génération automatique quotidienne</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={scheduleExport}
                    onChange={(e) => setScheduleExport(e.target.checked)}
                    className="toggle"
                  />
                </label>

                {scheduleExport && (
                  <div className="p-3 bg-green-500/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Programmé tous les jours à 02:00</span>
                      <button
                        onClick={handleScheduleExport}
                        className="text-xs text-green-500 hover:text-green-400"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                )}

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">Notification par email</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Recevoir un lien de téléchargement par email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.checked)}
                    className="toggle"
                  />
                </label>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-black hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Export en cours...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Exporter les données
                </>
              )}
            </button>
          </div>

          {/* Right Column - Info & History */}
          <div className="space-y-6">
            
            {/* Export Info */}
            <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database size={20} className="text-green-500" />
                <h3 className="text-lg font-black">Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Type de données:</span>
                  <span className="font-medium">{dataTypes.find(d => d.id === selectedDataType)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Format:</span>
                  <span className="font-medium">{exportFormats.find(f => f.id === selectedFormat)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Contenu:</span>
                  <span className="font-medium">Export CSV généré à la demande</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Colonnes:</span>
                  <span className="font-medium">24</span>
                </div>
              </div>
            </div>

            {/* Export History */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <History size={18} className="text-blue-500" />
                <h3 className="text-lg font-black">Export récents</h3>
              </div>
              <div className="space-y-3">
                {exportHistory.map((job) => (
                  <div key={job.id} className="p-3 rounded-xl border border-[var(--border)]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(job.status)}
                          <p className="text-sm font-medium">{job.name}</p>
                        </div>
                        <div className="flex gap-3 text-[10px] text-[var(--foreground-muted)]">
                          <span>{job.type}</span>
                          <span>{job.format}</span>
                          <span>{job.size}</span>
                        </div>
                        <p className="text-[10px] text-[var(--foreground-muted)] mt-1">{job.createdAt}</p>
                      </div>
                      {job.status === 'completed' && (
                        <a href={job.downloadUrl} className="p-1.5 hover:bg-green-500/10 rounded-lg transition-colors">
                          <Download size={14} className="text-green-500" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-xs text-blue-500 hover:text-blue-400">
                Voir tous les exports
              </button>
            </div>

            {/* Data Retention Info */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-500">Rétention des données</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">
                    Les exports sont conservés pendant 30 jours. Les données sensibles sont chiffrées.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .toggle {
            appearance: none;
            width: 44px;
            height: 24px;
            background: var(--border);
            border-radius: 12px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s;
          }
          .toggle:checked {
            background: #10b981;
          }
          .toggle::before {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: transform 0.3s;
          }
          .toggle:checked::before {
            transform: translateX(20px);
          }
        `}</style>
      </div>
    </div>
  );
}