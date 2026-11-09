// frontend/app/dashboard/hr/contracts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  DollarSign,
  Briefcase,
  User,
  Building2,
  Mail,
  Phone,
  CalendarDays,
  FileSignature,
  Shield,
  PenTool,
  Printer,
  Copy,
  Archive,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  type: "cdi" | "cdd" | "stage" | "freelance" | "interim";
  status: "active" | "expired" | "terminated" | "pending";
  startDate: string;
  endDate?: string;
  probationEndDate?: string;
  salary: number;
  currency: string;
  workHours: number;
  workLocation: string;
  documents: string[];
  signedBy: string;
  signedAt?: string;
  terminatedAt?: string;
  terminationReason?: string;
  notes?: string;
  createdAt: string;
}

export default function ContractsPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: "1",
      employeeId: "EMP001",
      employeeName: "Ahmed Benali",
      department: "IT",
      position: "Développeur Full Stack",
      type: "cdi",
      status: "active",
      startDate: "2024-01-15",
      probationEndDate: "2024-04-15",
      salary: 45000,
      currency: "DZD",
      workHours: 40,
      workLocation: "Alger",
      documents: ["contrat_cdi_ahmed.pdf"],
      signedBy: "Karim Mansouri",
      signedAt: "2024-01-10",
      createdAt: "2024-01-05"
    },
    {
      id: "2",
      employeeId: "EMP002",
      employeeName: "Fatima Zohra",
      department: "IT",
      position: "Chef de projet",
      type: "cdi",
      status: "active",
      startDate: "2023-08-01",
      salary: 65000,
      currency: "DZD",
      workHours: 40,
      workLocation: "Alger",
      documents: ["contrat_cdi_fatima.pdf"],
      signedBy: "Karim Mansouri",
      signedAt: "2023-07-25",
      createdAt: "2023-07-20"
    },
    {
      id: "3",
      employeeId: "EMP003",
      employeeName: "Mohamed Slimani",
      department: "Finance",
      position: "Comptable",
      type: "cdi",
      status: "active",
      startDate: "2024-02-10",
      probationEndDate: "2024-05-10",
      salary: 48000,
      currency: "DZD",
      workHours: 40,
      workLocation: "Alger",
      documents: ["contrat_cdi_mohamed.pdf"],
      signedBy: "Nadia Bensalem",
      signedAt: "2024-02-05",
      createdAt: "2024-02-01"
    },
    {
      id: "4",
      employeeId: "EMP004",
      employeeName: "Samira Kaci",
      department: "Marketing",
      position: "Responsable Marketing",
      type: "cdi",
      status: "active",
      startDate: "2023-11-20",
      salary: 58000,
      currency: "DZD",
      workHours: 40,
      workLocation: "Alger",
      documents: ["contrat_cdi_samira.pdf"],
      signedBy: "Karim Mansouri",
      signedAt: "2023-11-15",
      createdAt: "2023-11-10"
    },
    {
      id: "5",
      employeeId: "EMP005",
      employeeName: "Yacine Boukadoum",
      department: "IT",
      position: "Stagiaire",
      type: "stage",
      status: "active",
      startDate: "2024-03-01",
      endDate: "2024-08-31",
      salary: 15000,
      currency: "DZD",
      workHours: 35,
      workLocation: "Alger",
      documents: ["convention_stage_yacine.pdf"],
      signedBy: "Ahmed Benali",
      signedAt: "2024-02-25",
      createdAt: "2024-02-20"
    },
    {
      id: "6",
      employeeId: "EMP006",
      employeeName: "Nadia Bensalem",
      department: "Finance",
      position: "Directrice Financière",
      type: "cdi",
      status: "active",
      startDate: "2022-06-01",
      salary: 85000,
      currency: "DZD",
      workHours: 40,
      workLocation: "Alger",
      documents: ["contrat_cdi_nadia.pdf"],
      signedBy: "CEO",
      signedAt: "2022-05-25",
      createdAt: "2022-05-20"
    }
  ]);

  const departments = [...new Set(contracts.map(c => c.department))];

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expired: contracts.filter(c => c.status === 'expired').length,
    terminated: contracts.filter(c => c.status === 'terminated').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    cdi: contracts.filter(c => c.type === 'cdi').length,
    cdd: contracts.filter(c => c.type === 'cdd').length,
    stage: contracts.filter(c => c.type === 'stage').length,
    freelance: contracts.filter(c => c.type === 'freelance').length
  };

  useEffect(() => {
    filterContracts();
  }, [searchTerm, typeFilter, statusFilter, departmentFilter, contracts]);

  const filterContracts = () => {
    let filtered = [...contracts];
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(c => c.type === typeFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter(c => c.department === departmentFilter);
    }
    
    return filtered;
  };

  const getFilteredContracts = filterContracts();
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getFilteredContracts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getFilteredContracts.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle size={12} /> Actif</span>;
      case 'expired':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock size={12} /> Expiré</span>;
      case 'terminated':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12} /> Résilié</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20"><AlertCircle size={12} /> En attente</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'cdi':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">CDI</span>;
      case 'cdd':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">CDD</span>;
      case 'stage':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">Stage</span>;
      case 'freelance':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full">Freelance</span>;
      case 'interim':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-pink-500/10 text-pink-500 rounded-full">Intérim</span>;
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

  const getContractDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months > 0) {
      return `${months} mois${days > 0 ? ` ${days} jours` : ''}`;
    }
    return `${diffDays} jours`;
  };

  const terminateContract = (id: string) => {
    setContracts(contracts.map(c => 
      c.id === id 
        ? { ...c, status: "terminated", terminatedAt: new Date().toISOString(), terminationReason: "Résiliation par l'employeur" }
        : c
    ));
    toast.success("Contrat résilié avec succès");
    setShowTerminateModal(false);
  };

  const renewContract = (id: string) => {
    setContracts(contracts.map(c => 
      c.id === id 
        ? { ...c, status: "active", startDate: new Date().toISOString(), endDate: undefined }
        : c
    ));
    toast.success("Contrat renouvelé avec succès");
    setShowRenewModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <FileText className="text-indigo-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Gestion des contrats
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Suivi et gestion des contrats de travail
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
              Nouveau contrat
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Total</p>
                <p className="text-lg font-black text-indigo-500">{stats.total}</p>
              </div>
              <FileText size={14} className="text-indigo-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Actifs</p>
                <p className="text-lg font-black text-emerald-500">{stats.active}</p>
              </div>
              <CheckCircle size={14} className="text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">CDI</p>
                <p className="text-lg font-black text-blue-500">{stats.cdi}</p>
              </div>
              <FileSignature size={14} className="text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Stage</p>
                <p className="text-lg font-black text-green-500">{stats.stage}</p>
              </div>
              <Briefcase size={14} className="text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Expirés</p>
                <p className="text-lg font-black text-amber-500">{stats.expired}</p>
              </div>
              <Clock size={14} className="text-amber-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Résiliés</p>
                <p className="text-lg font-black text-red-500">{stats.terminated}</p>
              </div>
              <XCircle size={14} className="text-red-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Freelance</p>
                <p className="text-lg font-black text-orange-500">{stats.freelance}</p>
              </div>
              <PenTool size={14} className="text-orange-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Tous les types</option>
              <option value="cdi">CDI</option>
              <option value="cdd">CDD</option>
              <option value="stage">Stage</option>
              <option value="freelance">Freelance</option>
              <option value="interim">Intérim</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="expired">Expirés</option>
              <option value="terminated">Résiliés</option>
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

        {/* Contracts Table */}
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
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Salaire</span>
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
                {currentItems.map((contract) => (
                  <tr key={contract.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {contract.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white text-sm">{contract.employeeName}</p>
                          <p className="text-[10px] text-zinc-500">{contract.department} • {contract.position}</p>
                        </div>
                      </div>
                     </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(contract.type)}
                     </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {formatDate(contract.startDate)} → {contract.endDate ? formatDate(contract.endDate) : "..."}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Durée: {getContractDuration(contract.startDate, contract.endDate)}
                        </p>
                        {contract.probationEndDate && new Date(contract.probationEndDate) > new Date() && (
                          <p className="text-[9px] text-amber-500 mt-0.5">
                            Période d'essai jusqu'au {formatDate(contract.probationEndDate)}
                          </p>
                        )}
                      </div>
                     </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatSalary(contract.salary)}
                      </span>
                     </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(contract.status)}
                     </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={16} className="text-zinc-500 hover:text-indigo-500" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download size={16} className="text-zinc-500 hover:text-cyan-500" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Dupliquer"
                        >
                          <Copy size={16} className="text-zinc-500 hover:text-blue-500" />
                        </button>
                        {contract.status === "active" && contract.type !== "cdi" && (
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowRenewModal(true);
                            }}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Renouveler"
                          >
                            <RefreshCw size={16} className="text-zinc-500 hover:text-green-500" />
                          </button>
                        )}
                        {contract.status === "active" && (
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowTerminateModal(true);
                            }}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Résilier"
                          >
                            <XCircle size={16} className="text-zinc-500 hover:text-red-500" />
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Archiver"
                        >
                          <Archive size={16} className="text-zinc-500 hover:text-purple-500" />
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
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, getFilteredContracts.length)} sur {getFilteredContracts.length}
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

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <FileSignature className="text-indigo-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Nouveau contrat</h2>
                    <p className="text-xs text-zinc-500">Créez un nouveau contrat de travail</p>
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
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Employé</label>
                  <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    <option>Ahmed Benali</option>
                    <option>Fatima Zohra</option>
                    <option>Mohamed Slimani</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type de contrat</label>
                  <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    <option>CDI</option>
                    <option>CDD</option>
                    <option>Stage</option>
                    <option>Freelance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date de début</label>
                  <input type="date" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date de fin (optionnel)</label>
                  <input type="date" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Salaire mensuel</label>
                  <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Période d'essai (jours)</label>
                  <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="90" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Poste</label>
                  <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="Développeur" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Département</label>
                  <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    <option>IT</option>
                    <option>Finance</option>
                    <option>Marketing</option>
                    <option>RH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Lieu de travail</label>
                <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="Alger" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Notes</label>
                <textarea rows={3} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none" placeholder="Informations complémentaires..." />
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
                Créer le contrat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Contract Modal */}
      {showTerminateModal && selectedContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="text-red-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Résilier le contrat</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Êtes-vous sûr de vouloir résilier le contrat de <strong>{selectedContract.employeeName}</strong> ?
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Motif de résiliation</label>
                <textarea rows={3} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none" placeholder="Raison de la résiliation..." />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTerminateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => terminateContract(selectedContract.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                >
                  Résilier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renew Contract Modal */}
      {showRenewModal && selectedContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="text-green-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Renouveler le contrat</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Renouveler le contrat de <strong>{selectedContract.employeeName}</strong>
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nouvelle date de fin</label>
                  <input type="date" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nouveau salaire (optionnel)</label>
                  <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder={selectedContract.salary.toString()} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => renewContract(selectedContract.id)}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                >
                  Renouveler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}