// frontend/app/dashboard/hr/notes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Calendar,
  Tag,
  Pin,
  PinOff,
  Star,
  StarOff,
  Bell,
  BellOff,
  Paperclip,
  Image,
  Send,
  Save,
  AlertCircle,
  Users,
  Building2,
  Briefcase,
  FileText,
  Link as LinkIcon,
  Copy,
  Download,
  Printer,
  Lock
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Note {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  content: string;
  type: "general" | "performance" | "disciplinary" | "training" | "medical" | "personal";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  reminderDate?: string;
  isPinned: boolean;
  isPrivate: boolean;
  notifyEmployee: boolean;
}

export default function HrNotesPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      employeeId: "EMP001",
      employeeName: "Ahmed Benali",
      department: "IT",
      title: "Performance exceptionnelle",
      content: "Ahmed a montré une excellente performance ce mois-ci. A résolu plusieurs bugs critiques et a livré le projet avant la date prévue. Recommandation pour une prime exceptionnelle.",
      type: "performance",
      priority: "high",
      tags: ["performance", "prime", "projet"],
      attachments: [],
      createdBy: "Karim Mansouri",
      createdAt: "2024-03-15T10:30:00",
      isPinned: true,
      isPrivate: false,
      notifyEmployee: false
    },
    {
      id: "2",
      employeeId: "EMP002",
      employeeName: "Fatima Zohra",
      department: "IT",
      title: "Retard répété",
      content: "Fatima a accumulé 3 retards ce mois-ci. Discussion informelle pour rappeler les horaires de travail. À surveiller.",
      type: "disciplinary",
      priority: "medium",
      tags: ["retard", "ponctualité"],
      attachments: [],
      createdBy: "Karim Mansouri",
      createdAt: "2024-03-20T14:15:00",
      isPinned: false,
      isPrivate: false,
      notifyEmployee: true,
      reminderDate: "2024-03-25"
    },
    {
      id: "3",
      employeeId: "EMP003",
      employeeName: "Mohamed Slimani",
      department: "Finance",
      title: "Formation Excel avancé",
      content: "Mohamed a exprimé le souhait de suivre une formation Excel avancée. À organiser pour le mois prochain. Budget à prévoir: 15000 DA.",
      type: "training",
      priority: "low",
      tags: ["formation", "excel", "développement"],
      attachments: [],
      createdBy: "Nadia Bensalem",
      createdAt: "2024-03-18T09:45:00",
      isPinned: false,
      isPrivate: false,
      notifyEmployee: true,
      reminderDate: "2024-04-01"
    },
    {
      id: "4",
      employeeId: "EMP004",
      employeeName: "Samira Kaci",
      department: "Marketing",
      title: "Arrêt maladie",
      content: "Samira sera absente du 25/03 au 28/03 pour raisons médicales. Certificat médical à fournir.",
      type: "medical",
      priority: "high",
      tags: ["maladie", "absence"],
      attachments: [],
      createdBy: "Karim Mansouri",
      createdAt: "2024-03-24T11:00:00",
      isPinned: true,
      isPrivate: true,
      notifyEmployee: false
    },
    {
      id: "5",
      employeeId: "EMP005",
      employeeName: "Yacine Boukadoum",
      department: "IT",
      title: "Point d'étape stage",
      content: "Yacine a bien progressé sur son projet de stage. Bonne intégration dans l'équipe. Prochain point dans 2 semaines.",
      type: "performance",
      priority: "medium",
      tags: ["stage", "évaluation"],
      attachments: [],
      createdBy: "Ahmed Benali",
      createdAt: "2024-03-22T16:20:00",
      isPinned: false,
      isPrivate: false,
      notifyEmployee: false
    },
    {
      id: "6",
      employeeId: "EMP006",
      employeeName: "Nadia Bensalem",
      department: "Finance",
      title: "Demande de congé",
      content: "Nadia a demandé 5 jours de congé pour le mois de mai. À approuver cette semaine.",
      type: "general",
      priority: "low",
      tags: ["congé", "demande"],
      attachments: [],
      createdBy: "Karim Mansouri",
      createdAt: "2024-03-23T09:30:00",
      isPinned: false,
      isPrivate: false,
      notifyEmployee: true,
      reminderDate: "2024-03-28"
    }
  ]);

  const employees = [...new Set(notes.map(n => ({ id: n.employeeId, name: n.employeeName, department: n.department })))];

  const stats = {
    total: notes.length,
    pinned: notes.filter(n => n.isPinned).length,
    highPriority: notes.filter(n => n.priority === 'high' || n.priority === 'critical').length,
    performance: notes.filter(n => n.type === 'performance').length,
    disciplinary: notes.filter(n => n.type === 'disciplinary').length,
    training: notes.filter(n => n.type === 'training').length,
    medical: notes.filter(n => n.type === 'medical').length
  };

  useEffect(() => {
    filterNotes();
  }, [searchTerm, typeFilter, priorityFilter, employeeFilter, notes]);

  const filterNotes = () => {
    let filtered = [...notes];
    
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    if (priorityFilter !== "all") {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }
    
    if (employeeFilter !== "all") {
      filtered = filtered.filter(n => n.employeeId === employeeFilter);
    }
    
    return filtered;
  };

  const getFilteredNotes = filterNotes();
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getFilteredNotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getFilteredNotes.length / itemsPerPage);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'performance':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">Performance</span>;
      case 'disciplinary':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">Disciplinaire</span>;
      case 'training':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">Formation</span>;
      case 'medical':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">Médical</span>;
      case 'general':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-zinc-500/10 text-zinc-500 rounded-full">Général</span>;
      case 'personal':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Personnel</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/10 text-red-500">Critique</span>;
      case 'high':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/10 text-orange-500">Haute</span>;
      case 'medium':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500">Moyenne</span>;
      case 'low':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-500">Basse</span>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    toast.success("Note supprimée avec succès");
    setShowDeleteConfirm(false);
  };

  const togglePin = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    toast.success("Note épinglée/désépinglée");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <MessageSquare className="text-indigo-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Notes RH
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Gestion des notes et commentaires sur les employés
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
              Nouvelle note
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
              <MessageSquare size={14} className="text-indigo-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Épinglées</p>
                <p className="text-lg font-black text-amber-500">{stats.pinned}</p>
              </div>
              <Pin size={14} className="text-amber-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Haute priorité</p>
                <p className="text-lg font-black text-red-500">{stats.highPriority}</p>
              </div>
              <AlertCircle size={14} className="text-red-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Performance</p>
                <p className="text-lg font-black text-emerald-500">{stats.performance}</p>
              </div>
              <Star size={14} className="text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Disciplinaire</p>
                <p className="text-lg font-black text-red-500">{stats.disciplinary}</p>
              </div>
              <AlertCircle size={14} className="text-red-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase">Formation</p>
                <p className="text-lg font-black text-blue-500">{stats.training}</p>
              </div>
              <Briefcase size={14} className="text-blue-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par titre, contenu, employé, tags..."
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
              <option value="performance">Performance</option>
              <option value="disciplinary">Disciplinaire</option>
              <option value="training">Formation</option>
              <option value="medical">Médical</option>
              <option value="general">Général</option>
              <option value="personal">Personnel</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Toutes priorités</option>
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            >
              <option value="all">Tous les employés</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pinned Notes Section */}
          {currentItems.filter(n => n.isPinned).length > 0 && (
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Pin size={16} className="text-amber-500" />
                <h2 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Notes épinglées</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentItems.filter(n => n.isPinned).map((note) => (
                  <NoteCard 
                    key={note.id}
                    note={note}
                    onTogglePin={togglePin}
                    onDelete={() => {
                      setSelectedNote(note);
                      setShowDeleteConfirm(true);
                    }}
                    onEdit={() => {
                      setSelectedNote(note);
                      setShowEditModal(true);
                    }}
                    getTypeBadge={getTypeBadge}
                    getPriorityBadge={getPriorityBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes */}
          {currentItems.filter(n => !n.isPinned).length > 0 && (
            <div className="lg:col-span-2">
              {currentItems.filter(n => n.isPinned).length > 0 && (
                <div className="flex items-center gap-2 mb-3 mt-6">
                  <MessageSquare size={16} className="text-zinc-500" />
                  <h2 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Autres notes</h2>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentItems.filter(n => !n.isPinned).map((note) => (
                  <NoteCard 
                    key={note.id}
                    note={note}
                    onTogglePin={togglePin}
                    onDelete={() => {
                      setSelectedNote(note);
                      setShowDeleteConfirm(true);
                    }}
                    onEdit={() => {
                      setSelectedNote(note);
                      setShowEditModal(true);
                    }}
                    getTypeBadge={getTypeBadge}
                    getPriorityBadge={getPriorityBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-xs text-zinc-500">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, getFilteredNotes.length)} sur {getFilteredNotes.length}
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

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <MessageSquare className="text-indigo-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Nouvelle note</h2>
                    <p className="text-xs text-zinc-500">Ajouter une note sur un employé</p>
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
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type de note</label>
                  <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    <option value="general">Général</option>
                    <option value="performance">Performance</option>
                    <option value="disciplinary">Disciplinaire</option>
                    <option value="training">Formation</option>
                    <option value="medical">Médical</option>
                    <option value="personal">Personnel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Priorité</label>
                  <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tags</label>
                  <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="performance,prime,projet" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Titre</label>
                <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" placeholder="Titre de la note" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contenu</label>
                <textarea rows={5} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none" placeholder="Détails de la note..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Rappel (optionnel)</label>
                  <input type="date" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm" />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                    <span className="text-sm">Épingler</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                    <span className="text-sm">Privé</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                    <span className="text-sm">Notifier employé</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Pièces jointes</label>
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 text-center">
                  <Paperclip size={20} className="mx-auto text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-500">Cliquez ou glissez des fichiers ici</p>
                </div>
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
                <Save size={16} className="inline mr-2" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Supprimer la note</h2>
              <p className="text-zinc-500 text-sm mb-6">
                Êtes-vous sûr de vouloir supprimer cette note ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedNote(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
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
  );
}

// Note Card Component
function NoteCard({ 
  note, 
  onTogglePin, 
  onDelete, 
  onEdit,
  getTypeBadge,
  getPriorityBadge,
  formatDate 
}: { 
  note: Note; 
  onTogglePin: (id: string) => void; 
  onDelete: () => void; 
  onEdit: () => void;
  getTypeBadge: (type: string) => React.ReactNode;
  getPriorityBadge: (priority: string) => React.ReactNode;
  formatDate: (date: string) => string;
}) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all ${note.isPinned ? 'border-l-4 border-l-amber-500' : ''}`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              {note.employeeName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">{note.employeeName}</p>
              <p className="text-[9px] text-zinc-500">{note.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePin(note.id)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={note.isPinned ? "Désépingler" : "Épingler"}
            >
              {note.isPinned ? <Pin size={14} className="text-amber-500" /> : <PinOff size={14} className="text-zinc-400" />}
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit size={14} className="text-zinc-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 size={14} className="text-zinc-500 hover:text-red-500" />
            </button>
          </div>
        </div>
        
        <h3 className="font-bold text-zinc-900 dark:text-white mb-2">{note.title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-3">{note.content}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {getTypeBadge(note.type)}
          {getPriorityBadge(note.priority)}
          {note.tags.map(tag => (
            <span key={tag} className="text-[9px] font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">#{tag}</span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Clock size={10} />
            <span>{formatDate(note.createdAt)}</span>
            {note.reminderDate && (
              <>
                <Bell size={10} />
                <span>Rappel: {new Date(note.reminderDate).toLocaleDateString()}</span>
              </>
            )}
          </div>
          {note.isPrivate && (
            <span className="flex items-center gap-1 text-amber-500">
              <Lock size={10} />
              Privé
            </span>
          )}
        </div>
      </div>
    </div>
  );
}