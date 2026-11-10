// frontend/app/dashboard/hr/departments/page.tsx
"use client";
import { useEffect } from "react";
import { listDepartmentsAction, listEmployeesAction, createDepartmentAction, deleteDepartmentAction } from "@/app/actions/hrActions";
import { useState } from "react";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  Users,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  DollarSign,
  Settings,
  UserPlus,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
  managerEmail: string;
  managerPhone: string;
  location: string;
  employeeCount: number;
  budget: number;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  parentDepartment?: string;
  subDepartments?: string[];
}

export default function DepartmentsPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [departments, setDepartments] = useState<Department[]>([]);

  const stats = {
    total: departments.length,
    active: departments.filter(d => d.status === 'active').length,
    inactive: departments.filter(d => d.status === 'inactive').length,
    totalEmployees: departments.reduce((sum, d) => sum + d.employeeCount, 0),
    totalBudget: departments.reduce((sum, d) => sum + d.budget, 0)
  };

  const loadDepartments = async () => {
    setLoading(true);
    const [departmentsResult, employeesResult] = await Promise.all([listDepartmentsAction(), listEmployeesAction({ limit: 500 })]);
    if (!departmentsResult.success) {
      toast.error("Impossible de charger les départements");
      setLoading(false);
      return;
    }
    const counts = new Map<string, number>();
    for (const employee of employeesResult.employees) {
      const key = employee.department ?? "";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    setDepartments(departmentsResult.departments.map((department) => ({
      id: department.id,
      name: department.name,
      code: department.code || department.name.slice(0, 3).toUpperCase(),
      manager: "—",
      managerEmail: "—",
      managerPhone: "—",
      location: "—",
      employeeCount: counts.get(department.name) ?? 0,
      budget: 0,
      description: "",
      status: "active" as const,
      createdAt: new Date().toISOString(),
    })));
    setLoading(false);
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  useEffect(() => {
    filterDepartments();
  }, [searchTerm, statusFilter, departments]);

  const filterDepartments = () => {
    let filtered = [...departments];
    
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.manager.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    return filtered;
  };

  const getFilteredDepartments = filterDepartments();
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getFilteredDepartments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getFilteredDepartments.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle size={12} /> Actif</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12} /> Inactif</span>;
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

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(budget);
  };

  const deleteDepartment = async (id: string) => {
    const result = await deleteDepartmentAction(id);
    if (result.success) {
      setDepartments(departments.filter(d => d.id !== id));
      toast.success("Département supprimé avec succès");
    } else {
      toast.error(result.message || "Suppression impossible");
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Building2 className="text-indigo-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Départements
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Gestion des structures organisationnelles
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm">
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus size={18} />
              Nouveau département
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Total départements</p>
                <p className="text-2xl font-black text-indigo-500 mt-1">{stats.total}</p>
              </div>
              <Building2 size={20} className="text-indigo-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Employés</p>
                <p className="text-2xl font-black text-emerald-500 mt-1">{stats.totalEmployees}</p>
              </div>
              <Users size={20} className="text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Budget total</p>
                <p className="text-sm font-black text-amber-500 mt-1">{formatBudget(stats.totalBudget)}</p>
              </div>
              <DollarSign size={20} className="text-amber-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Actifs</p>
                <p className="text-2xl font-black text-cyan-500 mt-1">{stats.active}</p>
              </div>
              <CheckCircle size={20} className="text-cyan-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, code, responsable..."
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
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>

        {/* Departments Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-left w-[25%]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Département</span>
                  </th>
                  <th className="px-6 py-4 text-left w-[20%]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Responsable</span>
                  </th>
                  <th className="px-6 py-4 text-left w-[15%]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Employés</span>
                  </th>
                  <th className="px-6 py-4 text-left w-[20%]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Budget</span>
                  </th>
                  <th className="px-6 py-4 text-left w-[10%]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Statut</span>
                  </th>
                  <th className="px-6 py-4 text-right w-[10%]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Actions</span>
                  </th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {currentItems.map((dept) => (
                  <tr 
                    key={dept.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {dept.code.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{dept.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{dept.code}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{dept.manager}</p>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {dept.managerEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-zinc-400" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{dept.employeeCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBudget(dept.budget)}</p>
                        <p className="text-[9px] text-zinc-500">par an</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(dept.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/dashboard/hr/departments/${dept.id}`}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={16} className="text-zinc-500 hover:text-indigo-500" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedDepartment(dept);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} className="text-zinc-500 hover:text-amber-500" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDepartment(dept);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-zinc-500 hover:text-red-500" />
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
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, getFilteredDepartments.length)} sur {getFilteredDepartments.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  <ChevronUp size={16} className="rotate-270" />
                </button>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  <ChevronDown size={16} className="rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Department Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <Building2 className="text-indigo-500" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Nouveau département</h2>
                      <p className="text-xs text-zinc-500">Créez une nouvelle structure organisationnelle</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nom du département *</label>
                    <input
                      type="text"
                      value={newDepartmentName}
                      onChange={(event) => setNewDepartmentName(event.target.value)}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                      placeholder="Informatique"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Code *</label>
                    <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="IT" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Responsable</label>
                    <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                      <option value="">Sélectionner</option>
                      <option>Ahmed Benali</option>
                      <option>Nadia Bensalem</option>
                      <option>Karim Mansouri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Budget annuel</label>
                    <input type="number" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="0" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Localisation</label>
                  <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="Alger, Siège" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newDepartmentDescription}
                    onChange={(event) => setNewDepartmentDescription(event.target.value)}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none"
                    placeholder="Description du département..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Département parent</label>
                  <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    <option value="">Aucun</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
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
                  onClick={async () => {
                    if (!newDepartmentName.trim()) {
                      toast.error("Le nom du département est obligatoire");
                      return;
                    }
                    const result = await createDepartmentAction({
                      name: newDepartmentName.trim(),
                      description: newDepartmentDescription.trim() || undefined,
                    });
                    if (!result.success) {
                      toast.error(result.message || "Création impossible");
                      return;
                    }
                    toast.success("Département créé avec succès");
                    setShowCreateModal(false);
                    setNewDepartmentName("");
                    setNewDepartmentDescription("");
                    await loadDepartments();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Créer le département
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedDepartment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="text-red-500" size={24} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Supprimer le département</h2>
                <p className="text-zinc-500 text-sm mb-6">
                  Êtes-vous sûr de vouloir supprimer <strong>{selectedDepartment.name}</strong> ?
                  Les employés seront transférés.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedDepartment(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => deleteDepartment(selectedDepartment.id)}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}