// frontend/app/dashboard/hr/employees/page.tsx
"use client";

import { useState, useEffect } from "react";
import { listEmployeesAction, deleteEmployeeAction, type HrEmployee } from "@/app/actions/hrActions";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Settings,
  Shield,
  CreditCard,
  Activity,
  Briefcase,
  GraduationCap,
  Heart,
  MapPin,
  CalendarDays,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  DollarSign,
  FileText,
  Printer
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  status: "active" | "inactive" | "on_leave";
  contractType: "cdi" | "cdd" | "stage" | "freelance";
  salary: number;
  avatar?: string;
  manager?: string;
}

function toUiEmployee(employee: HrEmployee): Employee {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email ?? "—",
    phone: employee.phone ?? "—",
    position: employee.position ?? "—",
    department: employee.department ?? "—",
    hireDate: employee.hireDate,
    status: employee.status === "terminated" ? "inactive" : employee.status === "active" ? "active" : "inactive",
    contractType: employee.contractType === "intern" ? "stage" : employee.contractType,
    salary: employee.salary,
  };
}

export default function EmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const departments = [...new Set(employees.map(e => e.department))];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const result = await listEmployeesAction({
        search: searchTerm || undefined,
        status: statusFilter === "active" || statusFilter === "inactive" ? statusFilter : undefined,
      });
      if (cancelled) return;
      setEmployees(result.employees.map(toUiEmployee));
      if (!result.success && result.message) toast.error(result.message);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, statusFilter, departmentFilter, employees]);

  const filterEmployees = () => {
    let filtered = [...employees];
    
    if (searchTerm) {
      filtered = filtered.filter(e => 
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter(e => e.department === departmentFilter);
    }
    
    return filtered;
  };

  const getFilteredEmployees = filterEmployees();
  
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    onLeave: employees.filter(e => e.status === 'on_leave').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
    totalSalary: employees.reduce((sum, e) => sum + e.salary, 0)
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getFilteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getFilteredEmployees.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle size={12} /> Actif</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12} /> Inactif</span>;
      case 'on_leave':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock size={12} /> Congé</span>;
      default:
        return null;
    }
  };

  const getContractBadge = (type: string) => {
    switch (type) {
      case 'cdi':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">CDI</span>;
      case 'cdd':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">CDD</span>;
      case 'stage':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">Stage</span>;
      case 'freelance':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full">Freelance</span>;
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

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(salary);
  };

  const deleteEmployee = async (id: string) => {
    const result = await deleteEmployeeAction(id);
    if (result.success) {
      setEmployees(employees.filter(e => e.id !== id));
      toast.success("Employé supprimé avec succès");
    } else {
      toast.error(result.message || "Suppression impossible");
    }
    setShowDeleteConfirm(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Users className="text-indigo-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Employés
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Gestion des ressources humaines
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm">
              <Download size={16} />
              Exporter
            </button>
            <Link
              href="/dashboard/hr/employees/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <UserPlus size={18} />
              Nouvel employé
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Total</p>
                <p className="text-2xl font-black text-indigo-500 mt-1">{stats.total}</p>
              </div>
              <Users size={20} className="text-indigo-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Actifs</p>
                <p className="text-2xl font-black text-emerald-500 mt-1">{stats.active}</p>
              </div>
              <CheckCircle size={20} className="text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">En congé</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{stats.onLeave}</p>
              </div>
              <Clock size={20} className="text-amber-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Inactifs</p>
                <p className="text-2xl font-black text-red-500 mt-1">{stats.inactive}</p>
              </div>
              <XCircle size={20} className="text-red-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Masse salariale</p>
                <p className="text-sm font-black text-zinc-900 dark:text-white mt-1">{formatSalary(stats.totalSalary)}</p>
              </div>
              <DollarSign size={20} className="text-cyan-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, poste..."
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
              <option value="on_leave">En congé</option>
              <option value="inactive">Inactifs</option>
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

        {/* Employees Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Employé</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Contact</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Poste / Département</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Contrat</span>
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
                {currentItems.map((employee) => (
                  <tr 
                    key={employee.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedEmployee(expandedEmployee === employee.id ? null : employee.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">{employee.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                          <Mail size={12} className="text-zinc-400" />
                          {employee.email}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                          <Phone size={10} className="text-zinc-400" />
                          {employee.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">{employee.position}</p>
                        <p className="text-[10px] text-zinc-500">{employee.department}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getContractBadge(employee.contractType)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(employee.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
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
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, getFilteredEmployees.length)} sur {getFilteredEmployees.length}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="text-red-500" size={24} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Supprimer l'employé</h2>
                <p className="text-zinc-500 text-sm mb-6">
                  Êtes-vous sûr de vouloir supprimer <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong> ?
                  Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedEmployee(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => deleteEmployee(selectedEmployee.id)}
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