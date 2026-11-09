// frontend/app/dashboard/hr/attendance/page.tsx
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
  PieChart
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "present" | "absent" | "late" | "half-day" | "holiday";
  workingHours: number;
  overtime: number;
  department: string;
  notes?: string;
}

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [attendances, setAttendances] = useState<Attendance[]>([
    {
      id: "1",
      employeeId: "EMP001",
      employeeName: "Ahmed Benali",
      date: "2024-03-29",
      checkIn: "08:45",
      checkOut: "17:30",
      status: "present",
      workingHours: 7.75,
      overtime: 0.5,
      department: "IT"
    },
    {
      id: "2",
      employeeId: "EMP002",
      employeeName: "Fatima Zohra",
      date: "2024-03-29",
      checkIn: "09:15",
      checkOut: "18:00",
      status: "late",
      workingHours: 8,
      overtime: 0,
      department: "IT",
      notes: "Retard de 15 minutes"
    },
    {
      id: "3",
      employeeId: "EMP003",
      employeeName: "Mohamed Slimani",
      date: "2024-03-29",
      checkIn: "08:30",
      checkOut: "17:00",
      status: "present",
      workingHours: 7.5,
      overtime: 0,
      department: "Finance"
    },
    {
      id: "4",
      employeeId: "EMP004",
      employeeName: "Samira Kaci",
      date: "2024-03-29",
      checkIn: "",
      checkOut: "",
      status: "absent",
      workingHours: 0,
      overtime: 0,
      department: "Marketing",
      notes: "Congé maladie"
    },
    {
      id: "5",
      employeeId: "EMP005",
      employeeName: "Yacine Boukadoum",
      date: "2024-03-29",
      checkIn: "08:30",
      checkOut: "12:30",
      status: "half-day",
      workingHours: 4,
      overtime: 0,
      department: "IT",
      notes: "Départ à midi"
    },
    {
      id: "6",
      employeeId: "EMP006",
      employeeName: "Nadia Bensalem",
      date: "2024-03-29",
      checkIn: "",
      checkOut: "",
      status: "holiday",
      workingHours: 0,
      overtime: 0,
      department: "Finance",
      notes: "Congé annuel"
    }
  ]);

  const departments = [...new Set(attendances.map(a => a.department))];

  const stats = {
    total: attendances.length,
    present: attendances.filter(a => a.status === 'present').length,
    absent: attendances.filter(a => a.status === 'absent').length,
    late: attendances.filter(a => a.status === 'late').length,
    halfDay: attendances.filter(a => a.status === 'half-day').length,
    holiday: attendances.filter(a => a.status === 'holiday').length,
    totalWorkingHours: attendances.reduce((sum, a) => sum + a.workingHours, 0),
    totalOvertime: attendances.reduce((sum, a) => sum + a.overtime, 0)
  };

  useEffect(() => {
    filterAttendances();
  }, [searchTerm, statusFilter, departmentFilter, attendances]);

  const filterAttendances = () => {
    let filtered = [...attendances];
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter(a => a.department === departmentFilter);
    }
    
    return filtered;
  };

  const getFilteredAttendances = filterAttendances();
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getFilteredAttendances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getFilteredAttendances.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle size={12} /> Présent</span>;
      case 'absent':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12} /> Absent</span>;
      case 'late':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"><AlertCircle size={12} /> Retard</span>;
      case 'half-day':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20"><Clock size={12} /> Demi-journée</span>;
      case 'holiday':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20"><Calendar size={12} /> Congé</span>;
      default:
        return null;
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "--:--";
    return time;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { weekday: "long" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Calendar className="text-indigo-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Gestion des présences
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Suivi des heures d'arrivée et de départ
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
              onClick={() => setShowCheckModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus size={18} />
              Pointer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Total</p>
                <p className="text-lg font-black text-zinc-900 dark:text-white">{stats.total}</p>
              </div>
              <Users size={14} className="text-indigo-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Présents</p>
                <p className="text-lg font-black text-emerald-500">{stats.present}</p>
              </div>
              <UserCheck size={14} className="text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Absents</p>
                <p className="text-lg font-black text-red-500">{stats.absent}</p>
              </div>
              <UserX size={14} className="text-red-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Retards</p>
                <p className="text-lg font-black text-amber-500">{stats.late}</p>
              </div>
              <Timer size={14} className="text-amber-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Demi-journée</p>
                <p className="text-lg font-black text-blue-500">{stats.halfDay}</p>
              </div>
              <Coffee size={14} className="text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Heures travaillées</p>
                <p className="text-sm font-black text-cyan-500">{stats.totalWorkingHours}h</p>
              </div>
              <Briefcase size={14} className="text-cyan-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Heures supp.</p>
                <p className="text-sm font-black text-purple-500">{stats.totalOvertime}h</p>
              </div>
              <TrendingUp size={14} className="text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-white">
              {formatDate(selectedDate.toISOString())}
            </p>
            <p className="text-xs text-zinc-500 capitalize">{getDayName(selectedDate)}</p>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom ou matricule..."
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
              <option value="present">Présents</option>
              <option value="absent">Absents</option>
              <option value="late">Retards</option>
              <option value="half-day">Demi-journée</option>
              <option value="holiday">Congés</option>
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
            <div className="flex gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "list" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "calendar" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Calendrier
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Employé</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Département</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Arrivée</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Départ</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Heures</span>
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
                {currentItems.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {attendance.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white text-sm">{attendance.employeeName}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{attendance.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{attendance.department}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{formatTime(attendance.checkIn)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{formatTime(attendance.checkOut)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{attendance.workingHours}h</span>
                      {attendance.overtime > 0 && (
                        <span className="text-[9px] text-purple-500 ml-1">(+{attendance.overtime}h)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(attendance.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAttendance(attendance);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} className="text-zinc-500 hover:text-amber-500" />
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
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, getFilteredAttendances.length)} sur {getFilteredAttendances.length}
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

      {/* Check In/Out Modal */}
      {showCheckModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                  <Clock className="text-indigo-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Pointer</h2>
                <p className="text-sm text-zinc-500 mt-1">Enregistrer votre arrivée ou départ</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Employé</label>
                  <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    <option>Ahmed Benali</option>
                    <option>Fatima Zohra</option>
                    <option>Mohamed Slimani</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                  <div className="flex gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <input type="radio" name="type" value="checkin" defaultChecked className="w-4 h-4" />
                      <span className="text-sm">Arrivée</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <input type="radio" name="type" value="checkout" className="w-4 h-4" />
                      <span className="text-sm">Départ</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Heure</label>
                  <input type="time" defaultValue="09:00" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Notes (optionnel)</label>
                  <textarea rows={2} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none" placeholder="Raison du retard, etc..." />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCheckModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}