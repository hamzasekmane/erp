// frontend/app/dashboard/hr/payroll/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign,
  Calendar,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  Mail,
  Printer,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  CreditCard,
  Receipt,
  Calculator,
  AlertCircle,
  Building2,
  User,
  CalendarDays,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { payrollAction } from "@/app/actions/hrActions";

interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  month: string;
  year: number;
  baseSalary: number;
  bonuses: number;
  overtime: number;
  deductions: number;
  taxes: number;
  netSalary: number;
  status: "pending" | "paid" | "cancelled";
  paymentDate?: string;
  paymentMethod: "bank" | "cash" | "check";
  bankAccount?: string;
  notes?: string;
  createdAt: string;
}

export default function PayrollPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  const departments = [...new Set(payrolls.map(p => p.department))];

  const stats = {
    total: payrolls.length,
    paid: payrolls.filter(p => p.status === 'paid').length,
    pending: payrolls.filter(p => p.status === 'pending').length,
    totalGross: payrolls.reduce((sum, p) => sum + p.baseSalary + p.bonuses + p.overtime, 0),
    totalNet: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
    totalTaxes: payrolls.reduce((sum, p) => sum + p.taxes, 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + p.deductions, 0)
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
      const result = await payrollAction(month);
      if (cancelled) return;
      if (result.success) {
        setPayrolls(result.lines.map((line) => ({
          id: line.employeeId,
          employeeId: line.employeeId,
          employeeName: line.name,
          department: line.department ?? "—",
          position: "—",
          month: String(selectedMonth + 1).padStart(2, "0"),
          year: selectedYear,
          baseSalary: line.baseSalary,
          bonuses: 0,
          overtime: 0,
          deductions: line.deduction,
          taxes: 0,
          netSalary: line.netSalary,
          status: "pending" as const,
          paymentMethod: "bank" as const,
          createdAt: `${month}-01`,
          notes: line.leaveDays > 0 ? `${line.leaveDays} jour(s) de congé déduit(s)` : undefined,
        })));
      } else {
        toast.error(result.message || "Impossible de charger la paie");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    filterPayrolls();
  }, [searchTerm, statusFilter, departmentFilter, selectedMonth, selectedYear, payrolls]);

  const filterPayrolls = () => {
    let filtered = [...payrolls];
    
    // Filtre par mois et année
    filtered = filtered.filter(p => 
      p.month === String(selectedMonth + 1).padStart(2, '0') && 
      p.year === selectedYear
    );
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter(p => p.department === departmentFilter);
    }
    
    return filtered;
  };

  const getFilteredPayrolls = filterPayrolls();
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getFilteredPayrolls.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getFilteredPayrolls.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle size={12} /> Payé</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock size={12} /> En attente</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12} /> Annulé</span>;
      default:
        return null;
    }
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(salary);
  };

  const formatDate = (date: string) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getMonthName = (month: number) => {
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    return months[month];
  };

  const processPayroll = (id: string) => {
    setPayrolls(payrolls.map(p => 
      p.id === id 
        ? { ...p, status: "paid", paymentDate: new Date().toISOString() }
        : p
    ));
    toast.success("Paiement enregistré avec succès");
    setShowPayModal(false);
  };

  const months = Array.from({ length: 12 }, (_, i) => i);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <DollarSign className="text-indigo-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Gestion des paies
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Calcul et suivi des salaires
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm">
              <FileSpreadsheet size={16} />
              Exporter
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus size={18} />
              Générer une paie
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Total</p>
                <p className="text-lg font-black text-indigo-500">{stats.total}</p>
              </div>
              <Users size={14} className="text-indigo-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Payés</p>
                <p className="text-lg font-black text-emerald-500">{stats.paid}</p>
              </div>
              <CheckCircle size={14} className="text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">En attente</p>
                <p className="text-lg font-black text-amber-500">{stats.pending}</p>
              </div>
              <Clock size={14} className="text-amber-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Masse salariale</p>
                <p className="text-sm font-black text-cyan-500">{formatSalary(stats.totalGross)}</p>
              </div>
              <DollarSign size={14} className="text-cyan-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Net à payer</p>
                <p className="text-sm font-black text-purple-500">{formatSalary(stats.totalNet)}</p>
              </div>
              <Receipt size={14} className="text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Taxes & IRG</p>
                <p className="text-sm font-black text-red-500">{formatSalary(stats.totalTaxes)}</p>
              </div>
              <Calculator size={14} className="text-red-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-zinc-900 dark:text-white">
                {getMonthName(selectedMonth)} {selectedYear}
              </p>
            </div>
            <button
              onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-medium"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, département..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payés</option>
              <option value="pending">En attente</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Tous les départements</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Employé</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Poste</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Salaire brut</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Déductions</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Net à payer</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Statut</span>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Actions</span>
                  </th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {currentItems.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {payroll.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white text-sm">{payroll.employeeName}</p>
                          <p className="text-[10px] text-zinc-500">{payroll.department}</p>
                        </div>
                      </div>
                     </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{payroll.position}</span>
                     </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatSalary(payroll.baseSalary + payroll.bonuses + payroll.overtime)}</p>
                        {payroll.bonuses > 0 && (
                          <p className="text-[9px] text-green-500">+{formatSalary(payroll.bonuses)} primes</p>
                        )}
                      </div>
                     </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-red-500">{formatSalary(payroll.deductions + payroll.taxes)}</p>
                        <p className="text-[9px] text-zinc-500">IRG: {formatSalary(payroll.taxes)}</p>
                      </div>
                     </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatSalary(payroll.netSalary)}</span>
                     </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payroll.status)}
                     </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayroll(payroll);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={16} className="text-zinc-500 hover:text-indigo-500" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Télécharger bulletin"
                        >
                          <FileText size={16} className="text-zinc-500 hover:text-cyan-500" />
                        </button>
                        {payroll.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedPayroll(payroll);
                              setShowPayModal(true);
                            }}
                            className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Enregistrer paiement"
                          >
                            <CheckCircle size={16} className="text-zinc-500 hover:text-emerald-500" />
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Envoyer par email"
                        >
                          <Mail size={16} className="text-zinc-500 hover:text-blue-500" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Imprimer"
                        >
                          <Printer size={16} className="text-zinc-500 hover:text-zinc-700" />
                        </button>
                      </div>
                     </td>
                   </tr>
                ))}
              </tbody>
             </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, getFilteredPayrolls.length)} sur {getFilteredPayrolls.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Payroll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <DollarSign className="text-indigo-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Générer une paie</h2>
                    <p className="text-xs text-zinc-500">Créez une nouvelle fiche de paie</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-zinc-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Employé</label>
                <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                  {payrolls.map(p => (
                    <option key={p.id}>{p.employeeName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Période</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    {months.map(m => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                  <select className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Salaire de base</label>
                <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Primes</label>
                <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Heures supplémentaires</label>
                <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Déductions</label>
                <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="0.00" />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
              >
                Générer la paie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="text-emerald-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Enregistrer le paiement</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Confirmez le paiement de la paie de <strong>{selectedPayroll.employeeName}</strong>
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-3">{formatSalary(selectedPayroll.netSalary)}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => processPayroll(selectedPayroll.id)}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Confirmer le paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}