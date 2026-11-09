// frontend/app/dashboard/hr/leaves/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
  UserX,
  UserMinus,
  Timer,
  Coffee,
  Briefcase,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  CalendarDays,
  FileText,
  MessageSquare,
  Send,
  Ban
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  type: "annual" | "sick" | "unpaid" | "maternity" | "exceptional";
  startDate: string;
  endDate: string;
  duration: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  notes?: string;
}

export default function LeavesPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [leaves, setLeaves] = useState<Leave[]>([
    {
      id: "1",
      employeeId: "EMP001",
      employeeName: "Ahmed Benali",
      department: "IT",
      type: "annual",
      startDate: "2024-04-01",
      endDate: "2024-04-07",
      duration: 7,
      status: "pending",
      reason: "Vacances familiales",
      createdAt: "2024-03-20",
      notes: "Souhaité depuis longtemps"
    },
    {
      id: "2",
      employeeId: "EMP002",
      employeeName: "Fatima Zohra",
      department: "IT",
      type: "sick",
      startDate: "2024-03-25",
      endDate: "2024-03-28",
      duration: 4,
      status: "approved",
      reason: "Grippe avec fièvre",
      approvedBy: "Karim Mansouri",
      approvedAt: "2024-03-21",
      createdAt: "2024-03-21"
    },
    {
      id: "3",
      employeeId: "EMP003",
      employeeName: "Mohamed Slimani",
      department: "Finance",
      type: "annual",
      startDate: "2024-04-15",
      endDate: "2024-04-22",
      duration: 8,
      status: "approved",
      reason: "Voyage à l'étranger",
      approvedBy: "Nadia Bensalem",
      approvedAt: "2024-03-22",
      createdAt: "2024-03-18"
    },
    {
      id: "4",
      employeeId: "EMP004",
      employeeName: "Samira Kaci",
      department: "Marketing",
      type: "unpaid",
      startDate: "2024-05-01",
      endDate: "2024-05-15",
      duration: 15,
      status: "pending",
      reason: "Formation personnelle",
      createdAt: "2024-03-25"
    },
    {
      id: "5",
      employeeId: "EMP005",
      employeeName: "Yacine Boukadoum",
      department: "IT",
      type: "sick",
      startDate: "2024-03-20",
      endDate: "2024-03-22",
      duration: 3,
      status: "rejected",
      reason: "Légère fatigue",
      approvedBy: "Karim Mansouri",
      approvedAt: "2024-03-19",
      createdAt: "2024-03-19",
      notes: "Pas de certificat médical"
    },
    {
      id: "6",
      employeeId: "EMP006",
      employeeName: "Nadia Bensalem",
      department: "Finance",
      type: "exceptional",
      startDate: "2024-03-28",
      endDate: "2024-03-29",
      duration: 2,
      status: "approved",
      reason: "Urgence familiale",
      approvedBy: "Karim Mansouri",
      approvedAt: "2024-03-27",
      createdAt: "2024-03-27"
    }
  ]);

  const departments = [...new Set(leaves.map(l => l.department))];

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    cancelled: leaves.filter(l => l.status === 'cancelled').length,
    totalDays: leaves.reduce((sum, l) => sum + l.duration, 0),
    annualDays: leaves.filter(l => l.type === 'annual').reduce((sum, l) => sum + l.duration, 0),
    sickDays: leaves.filter(l => l.type === 'sick').reduce((sum, l) => sum + l.duration, 0)
  };

  useEffect(() => {
    filterLeaves();
  }, [searchTerm, statusFilter, typeFilter, departmentFilter, leaves]);

  const filterLeaves = () => {
    let filtered = [...leaves];
    
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(l => l.type === typeFilter);
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter(l => l.department === departmentFilter);
    }
    
    return filtered;
  };

  const getFilteredLeaves = filterLeaves();
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getFilteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getFilteredLeaves.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock size={12} /> En attente</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle size={12} /> Approuvé</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12} /> Refusé</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"><Ban size={12} /> Annulé</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'annual':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">Congés annuels</span>;
      case 'sick':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">Maladie</span>;
      case 'unpaid':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full">Sans solde</span>;
      case 'maternity':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-pink-500/10 text-pink-500 rounded-full">Maternité</span>;
      case 'exceptional':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">Exceptionnel</span>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const approveLeave = (id: string) => {
    setLeaves(leaves.map(l => 
      l.id === id 
        ? { ...l, status: "approved", approvedBy: "Administrateur", approvedAt: new Date().toISOString() }
        : l
    ));
    toast.success("Congé approuvé avec succès");
    setShowApproveModal(false);
  };

  const rejectLeave = (id: string) => {
    setLeaves(leaves.map(l => 
      l.id === id ? { ...l, status: "rejected" } : l
    ));
    toast.success("Congé refusé");
    setShowRejectModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <CalendarDays className="text-indigo-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Gestion des congés
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Demandes et suivi des absences
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm">
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus size={18} />
              Demander un congé
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
              <CalendarDays size={14} className="text-indigo-500 opacity-50" />
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
                <p className="text-[8px] font-black text-zinc-500 uppercase">Approuvés</p>
                <p className="text-lg font-black text-emerald-500">{stats.approved}</p>
              </div>
              <CheckCircle size={14} className="text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Jours totaux</p>
                <p className="text-sm font-black text-cyan-500">{stats.totalDays}j</p>
              </div>
              <Calendar size={14} className="text-cyan-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Congés annuels</p>
                <p className="text-sm font-black text-blue-500">{stats.annualDays}j</p>
              </div>
              <Briefcase size={14} className="text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Maladie</p>
                <p className="text-sm font-black text-green-500">{stats.sickDays}j</p>
              </div>
              <UserMinus size={14} className="text-green-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Refusés</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Tous les types</option>
              <option value="annual">Congés annuels</option>
              <option value="sick">Maladie</option>
              <option value="unpaid">Sans solde</option>
              <option value="exceptional">Exceptionnel</option>
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

        {/* Leaves Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Employé</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Type</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Période</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Durée</span>
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
                {currentItems.map((leave) => (
                  <tr key={leave.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {leave.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white text-sm">{leave.employeeName}</p>
                          <p className="text-[10px] text-zinc-500">{leave.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(leave.type)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{leave.reason}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{leave.duration} jours</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={16} className="text-zinc-500 hover:text-indigo-500" />
                        </button>
                        {leave.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowApproveModal(true);
                              }}
                              className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Approuver"
                            >
                              <CheckCircle size={16} className="text-zinc-500 hover:text-emerald-500" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowRejectModal(true);
                              }}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Refuser"
                            >
                              <XCircle size={16} className="text-zinc-500 hover:text-red-500" />
                            </button>
                          </>
                        )}
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
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, getFilteredLeaves.length)} sur {getFilteredLeaves.length}
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

      {/* Create Leave Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <CalendarDays className="text-indigo-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Demander un congé</h2>
                    <p className="text-xs text-zinc-500">Remplissez le formulaire ci-dessous</p>
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
                  <option>Ahmed Benali</option>
                  <option>Fatima Zohra</option>
                  <option>Mohamed Slimani</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type de congé</label>
                <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                  <option>Congés annuels</option>
                  <option>Congés maladie</option>
                  <option>Congés sans solde</option>
                  <option>Congés exceptionnel</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date début</label>
                  <input type="date" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date fin</label>
                  <input type="date" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Motif</label>
                <textarea rows={3} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none" placeholder="Raison du congé..." />
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
                <Send size={16} className="inline mr-2" />
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="text-emerald-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Approuver le congé</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Êtes-vous sûr de vouloir approuver le congé de <strong>{selectedLeave.employeeName}</strong> ?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => approveLeave(selectedLeave.id)}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Approuver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="text-red-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Refuser le congé</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Êtes-vous sûr de vouloir refuser le congé de <strong>{selectedLeave.employeeName}</strong> ?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => rejectLeave(selectedLeave.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                >
                  Refuser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}