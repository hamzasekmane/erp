"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Save,
  Eye,
  Plus,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Mail,
  Phone,
  MapPin,
  Activity,
  Zap,
  Target,
  Award,
  Crown,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Landmark,
  Calculator,
  Percent,
  Timer,
  UserCheck,
  UserX,
  Box,
  Layers,
  Tag,
  Truck,
  ShoppingCart,
  Globe,
  Shield,
  Lock,
  Key,
  Smartphone,
  Monitor,
  Wifi,
  Database,
  Server,
  Cloud,
  Code,
  GitBranch,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Figma,
  Slack} from "lucide-react";

// Types pour le builder de rapport
interface ReportColumn {
  id: string;
  name: string;
  field: string;
  visible: boolean;
  width?: number;
}

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ChartConfig {
  type: "bar" | "line" | "pie";
  title: string;
  xAxis: string;
  yAxis: string;
}

export default function CustomReportPage() {
  const [reportName, setReportName] = useState<string>("Rapport personnalisé");
  const [reportType, setReportType] = useState<string>("sales");
  const [dateRange, setDateRange] = useState<string>("last30");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [savedReports, setSavedReports] = useState<string[]>(["Rapport ventes mensuel", "Analyse clients", "Performance produits"]);

  // Colonnes disponibles
  const availableColumns = [
    { id: "col1", name: "ID", field: "id", category: "Général" },
    { id: "col2", name: "Client", field: "customer", category: "Client" },
    { id: "col3", name: "Email", field: "email", category: "Client" },
    { id: "col4", name: "Téléphone", field: "phone", category: "Client" },
    { id: "col5", name: "Produit", field: "product", category: "Produit" },
    { id: "col6", name: "Catégorie", field: "category", category: "Produit" },
    { id: "col7", name: "Quantité", field: "quantity", category: "Vente" },
    { id: "col8", name: "Prix unitaire", field: "unitPrice", category: "Vente" },
    { id: "col9", name: "Total HT", field: "total", category: "Vente" },
    { id: "col10", name: "TVA", field: "vat", category: "Vente" },
    { id: "col11", name: "Total TTC", field: "totalWithVat", category: "Vente" },
    { id: "col12", name: "Date", field: "date", category: "Général" },
    { id: "col13", name: "Statut", field: "status", category: "Général" },
    { id: "col14", name: "Pays", field: "country", category: "Client" },
    { id: "col15", name: "Ville", field: "city", category: "Client" }
  ];

  // Colonnes sélectionnées
  const [selectedColumns, setSelectedColumns] = useState<ReportColumn[]>([
    { id: "col2", name: "Client", field: "customer", visible: true },
    { id: "col5", name: "Produit", field: "product", visible: true },
    { id: "col9", name: "Total HT", field: "total", visible: true },
    { id: "col11", name: "Total TTC", field: "totalWithVat", visible: true },
    { id: "col12", name: "Date", field: "date", visible: true },
    { id: "col13", name: "Statut", field: "status", visible: true }
  ]);

  // Filtres
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: "1", field: "status", operator: "equals", value: "completed" }
  ]);

  // Données simulées du rapport
  const reportData = [
    { id: "INV-001", customer: "TechCorp", email: "contact@techcorp.com", product: "ERP Pro", quantity: 2, unitPrice: 299, total: 598, vat: 119.6, totalWithVat: 717.6, date: "2024-01-15", status: "completed", country: "France", city: "Paris" },
    { id: "INV-002", customer: "Innovation Labs", email: "admin@innovationlabs.com", product: "Module RH", quantity: 5, unitPrice: 99, total: 495, vat: 99, totalWithVat: 594, date: "2024-01-14", status: "completed", country: "France", city: "Lyon" },
    { id: "INV-003", customer: "Digital Solutions", email: "info@digitalsolutions.com", product: "Support Premium", quantity: 1, unitPrice: 499, total: 499, vat: 99.8, totalWithVat: 598.8, date: "2024-01-13", status: "pending", country: "Belgique", city: "Bruxelles" },
    { id: "INV-004", customer: "Cloud Systems", email: "sales@cloudsystems.com", product: "Analytics Pro", quantity: 3, unitPrice: 199, total: 597, vat: 119.4, totalWithVat: 716.4, date: "2024-01-12", status: "completed", country: "France", city: "Marseille" },
    { id: "INV-005", customer: "Data Analytics", email: "contact@dataanalytics.com", product: "Module CRM", quantity: 2, unitPrice: 79, total: 158, vat: 31.6, totalWithVat: 189.6, date: "2024-01-11", status: "cancelled", country: "Suisse", city: "Genève" }
  ];

  const getStatusColor = (status: string): string => {
    switch(status) {
      case "completed": return "bg-emerald-500/10 text-emerald-500";
      case "pending": return "bg-amber-500/10 text-amber-500";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-[var(--accent)]/10 text-[var(--accent)]";
    }
  };

  const getStatusText = (status: string): string => {
    switch(status) {
      case "completed": return "Complété";
      case "pending": return "En attente";
      case "cancelled": return "Annulé";
      default: return status;
    }
  };

  const addFilter = () => {
    setFilters([...filters, { id: Date.now().toString(), field: "status", operator: "equals", value: "" }]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const toggleColumn = (column: any) => {
    const existing = selectedColumns.find(c => c.id === column.id);
    if (existing) {
      setSelectedColumns(selectedColumns.filter(c => c.id !== column.id));
    } else {
      setSelectedColumns([...selectedColumns, { ...column, visible: true }]);
    }
  };

  const getChartData = () => {
    // Simuler des données pour le graphique
    return {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
      values: [12400, 14200, 15800, 17200, 18900, 20500]
    };
  };

  const handleSaveReport = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSavedReports([...savedReports, reportName]);
      setIsLoading(false);
      alert("Rapport sauvegardé !");
    }, 1000);
  };

  const handleExport = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Export en cours...");
    }, 1000);
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.values);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/report"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <Settings size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • CUSTOM
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● BUILDER
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Rapport <span className="text-[var(--accent)]">Personnalisé</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Créez des rapports sur mesure selon vos besoins
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm">
              <option>Derniers 30 jours</option>
              <option>Ce trimestre</option>
              <option>Cette année</option>
              <option>Personnalisé</option>
            </select>
            <button 
              onClick={handleSaveReport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              Sauvegarder
            </button>
            <button 
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--accent)]/10 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>

        {/* REPORT CONFIGURATION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Report Info */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <FileText size={14} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-black">Informations</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Nom du rapport</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Type de rapport</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="sales">Ventes</option>
                    <option value="clients">Clients</option>
                    <option value="products">Produits</option>
                    <option value="financial">Financier</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Saved Reports */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <Save size={14} className="text-emerald-500" />
                </div>
                <h3 className="font-black">Rapports sauvegardés</h3>
              </div>
              <div className="space-y-2">
                {savedReports.map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors">
                    <span className="text-sm">{report}</span>
                    <button className="p-1 hover:bg-[var(--accent)]/10 rounded">
                      <Eye size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Columns */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Layers size={14} className="text-purple-500" />
                </div>
                <h3 className="font-black">Colonnes disponibles</h3>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {["Général", "Client", "Produit", "Vente"].map((category) => (
                  <div key={category}>
                    <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase mb-2">{category}</p>
                    {availableColumns
                      .filter(col => col.category === category)
                      .map((column) => (
                        <label key={column.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)]/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedColumns.some(c => c.id === column.id)}
                            onChange={() => toggleColumn(column)}
                            className="rounded border-[var(--border)]"
                          />
                          <span className="text-sm">{column.name}</span>
                        </label>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Filters */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Preview */}
            {showChart && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                      <BarChart3 size={14} className="text-[var(--accent)]" />
                    </div>
                    <h3 className="font-black">Aperçu graphique</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType("bar")}
                      className={`p-1.5 rounded-lg transition-colors ${chartType === "bar" ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--accent)]/10'}`}
                    >
                      <BarChart3 size={14} />
                    </button>
                    <button
                      onClick={() => setChartType("line")}
                      className={`p-1.5 rounded-lg transition-colors ${chartType === "line" ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--accent)]/10'}`}
                    >
                      <LineChart size={14} />
                    </button>
                    <button
                      onClick={() => setChartType("pie")}
                      className={`p-1.5 rounded-lg transition-colors ${chartType === "pie" ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--accent)]/10'}`}
                    >
                      <PieChart size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="relative h-64">
                  {chartType === "bar" && (
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      {chartData.values.map((value, i) => {
                        const height = (value / maxValue) * 180;
                        const x = i * (500 / chartData.values.length) + 20;
                        const width = 40;
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={200 - height}
                            width={width}
                            height={height}
                            fill="#06b6d4"
                            opacity="0.7"
                            rx="4"
                          />
                        );
                      })}
                    </svg>
                  )}
                  {chartType === "line" && (
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M 0,${200 - (chartData.values[0] / maxValue) * 180} 
                             L ${500/6},${200 - (chartData.values[1] / maxValue) * 180} 
                             L ${1000/6},${200 - (chartData.values[2] / maxValue) * 180} 
                             L ${1500/6},${200 - (chartData.values[3] / maxValue) * 180} 
                             L ${2000/6},${200 - (chartData.values[4] / maxValue) * 180} 
                             L ${2500/6},${200 - (chartData.values[5] / maxValue) * 180} 
                             L 500,200 L 0,200 Z`}
                        fill="url(#lineGradient)"
                      />
                      <polyline
                        points={chartData.values.map((value, i) => 
                          `${i * (500/6)},${200 - (value / maxValue) * 180}`
                        ).join(' ')}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                  {chartType === "pie" && (
                    <div className="flex items-center justify-center h-full">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="10" />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="10"
                            strokeDasharray="141.5 283"
                            transform="rotate(-90 50 50)"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="10"
                            strokeDasharray="84.9 283"
                            strokeDashoffset="-141.5"
                            transform="rotate(-90 50 50)"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="10"
                            strokeDasharray="56.6 283"
                            strokeDashoffset="-226.4"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-4">
                  {chartData.labels.map((label, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{label}</p>
                      <p className="text-[9px] font-bold">{chartData.values[i].toLocaleString()}€</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <Filter size={14} className="text-amber-500" />
                  </div>
                  <h3 className="font-black">Filtres</h3>
                </div>
                <button onClick={addFilter} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                  <Plus size={12} />
                  Ajouter un filtre
                </button>
              </div>
              
              <div className="space-y-3">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex items-center gap-2">
                    <select className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm">
                      <option>Statut</option>
                      <option>Client</option>
                      <option>Produit</option>
                      <option>Date</option>
                    </select>
                    <select className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm">
                      <option>Est égal à</option>
                      <option>Contient</option>
                      <option>Commence par</option>
                      <option>Termine par</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Valeur"
                      className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
                    />
                    <button onClick={() => removeFilter(filter.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                      <Database size={14} className="text-[var(--accent)]" />
                    </div>
                    <h3 className="font-black">Aperçu des données</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[var(--foreground-muted)]">{reportData.length} lignes</span>
                    <button className="p-1 hover:bg-[var(--accent)]/10 rounded">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                    <tr>
                      {selectedColumns.map((col) => (
                        <th key={col.id} className="p-3 text-left text-[9px] font-black uppercase">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--background)]/50 transition-colors">
                        {selectedColumns.map((col) => {
                          let value = row[col.field as keyof typeof row];
                          if (col.field === "status") {
                            return (
                              <td key={col.id} className="p-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black ${getStatusColor(value as string)}`}>
                                  {value === "completed" && <CheckCircle size={8} />}
                                  {value === "pending" && <Clock size={8} />}
                                  {value === "cancelled" && <XCircle size={8} />}
                                  {getStatusText(value as string)}
                                </span>
                              </td>
                            );
                          }
                          if (col.field === "total" || col.field === "totalWithVat" || col.field === "unitPrice") {
                            return (
                              <td key={col.id} className="p-3 text-sm font-medium">
                                {typeof value === 'number' ? value.toLocaleString() + '€' : value}
                              </td>
                            );
                          }
                          return (
                            <td key={col.id} className="p-3 text-sm">
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Custom Report Builder • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Rapports personnalisables en temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}