// frontend/app/dashboard/file/backup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2,
  Clock,
  Calendar,
  HardDrive,
  Shield,
  AlertCircle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  History,
  FileText,
  FolderOpen,
  Cloud,
  Server,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Plus,
  XCircle,
   User
} from "lucide-react";
import toast from "react-hot-toast";

interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  type: "database" | "files" | "full";
  status: "completed" | "failed" | "in_progress";
  createdBy: string;
  downloadUrl?: string;
}

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"backups" | "schedule" | "settings" | "restore">("backups");
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: "1",
      name: "backup_full_2024-03-29_03-00-00",
      size: 125829120, // 120 MB
      createdAt: "2024-03-29T03:00:00",
      type: "full",
      status: "completed",
      createdBy: "Système"
    },
    {
      id: "2",
      name: "backup_database_2024-03-28_12-00-00",
      size: 52428800, // 50 MB
      createdAt: "2024-03-28T12:00:00",
      type: "database",
      status: "completed",
      createdBy: "Admin"
    },
    {
      id: "3",
      name: "backup_files_2024-03-27_18-30-00",
      size: 73400320, // 70 MB
      createdAt: "2024-03-27T18:30:00",
      type: "files",
      status: "failed",
      createdBy: "Système"
    },
    {
      id: "4",
      name: "backup_full_2024-03-26_03-00-00",
      size: 115343360, // 110 MB
      createdAt: "2024-03-26T03:00:00",
      type: "full",
      status: "completed",
      createdBy: "Système"
    }
  ]);

  const [schedule, setSchedule] = useState({
    enabled: true,
    frequency: "daily",
    time: "03:00",
    dayOfWeek: "sunday",
    dayOfMonth: "1",
    retentionDays: 30,
    backupTypes: ["full", "database", "files"],
    destination: "s3",
    emailNotification: true
  });

  const [storage, setStorage] = useState({
    total: 5 * 1024 * 1024 * 1024, // 5 GB
    used: 2.3 * 1024 * 1024 * 1024, // 2.3 GB
    backups: 15
  });

  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulation de chargement
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: "database" | "files" | "full") => {
    setCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success(`Backup ${type === 'full' ? 'complet' : type === 'database' ? 'base de données' : 'fichiers'} créé avec succès`);
      fetchBackups();
    } catch (error) {
      toast.error("Erreur lors de la création du backup");
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cette action remplacera les données actuelles.")) {
      return;
    }
    
    setRestoring(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.success("Restauration terminée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la restauration");
    } finally {
      setRestoring(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette sauvegarde ?")) {
      return;
    }
    
    try {
      setBackups(backups.filter(b => b.id !== backupId));
      toast.success("Sauvegarde supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const downloadBackup = (backup: Backup) => {
    toast.success(`Téléchargement de ${backup.name} démarré`);
    // Implémenter le téléchargement réel
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">Complet</span>;
      case 'database':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">Base de données</span>;
      case 'files':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">Fichiers</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">Terminé</span>;
      case 'failed':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">Échoué</span>;
      case 'in_progress':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full animate-pulse">En cours</span>;
      default:
        return null;
    }
  };

  const storagePercentage = (storage.used / storage.total) * 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <Database className="text-cyan-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Sauvegardes
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Gérez les sauvegardes de vos données et fichiers
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => createBackup("database")}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            {creating ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
            Backup DB
          </button>
          <button
            onClick={() => createBackup("files")}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            {creating ? <Loader2 className="animate-spin" size={16} /> : <FolderOpen size={16} />}
            Backup Files
          </button>
          <button
            onClick={() => createBackup("full")}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/20"
          >
            {creating ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
            Backup Complet
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Espace utilisé</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                {formatSize(storage.used)} / {formatSize(storage.total)}
              </p>
            </div>
            <HardDrive size={20} className="text-cyan-500 opacity-50" />
          </div>
          <div className="mt-3 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Sauvegardes</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{storage.backups}</p>
            </div>
            <Database size={20} className="text-emerald-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Dernière sauvegarde</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">Aujourd'hui 03:00</p>
            </div>
            <Clock size={20} className="text-amber-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Prochaine sauvegarde</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">Demain 03:00</p>
            </div>
            <Calendar size={20} className="text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-cyan-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-cyan-500">Sécurité des données</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Les sauvegardes sont chiffrées et stockées de manière sécurisée. La rétention est configurée pour 30 jours.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: "backups", label: "Sauvegardes", icon: Database },
          { id: "schedule", label: "Planification", icon: Calendar },
          { id: "settings", label: "Paramètres", icon: Settings },
          { id: "restore", label: "Restauration", icon: RefreshCw }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? "text-cyan-600 dark:text-cyan-500"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Backups Tab */}
        {activeTab === "backups" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-cyan-500" size={40} />
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-500/10 rounded-lg">
                            {backup.type === 'full' && <Database size={18} className="text-cyan-500" />}
                            {backup.type === 'database' && <Database size={18} className="text-blue-500" />}
                            {backup.type === 'files' && <FolderOpen size={18} className="text-green-500" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-zinc-900 dark:text-white">{backup.name}</h4>
                              {getTypeBadge(backup.type)}
                              {getStatusBadge(backup.status)}
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <HardDrive size={10} />
                                {formatSize(backup.size)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {formatDate(backup.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={10} />
                                {backup.createdBy}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadBackup(backup)}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download size={18} className="text-zinc-500 hover:text-cyan-500" />
                        </button>
                        <button
                          onClick={() => restoreBackup(backup.id)}
                          disabled={restoring}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Restaurer"
                        >
                          <RefreshCw size={18} className="text-zinc-500 hover:text-amber-500" />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} className="text-zinc-500 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-cyan-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-white">Planification automatique</h3>
                </div>
                <button
                  onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    schedule.enabled ? 'bg-cyan-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    schedule.enabled ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Fréquence</label>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  >
                    <option value="hourly">Toutes les heures</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Heure</label>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Types de sauvegarde</label>
                  <div className="space-y-2">
                    {['full', 'database', 'files'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.backupTypes.includes(type)}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...schedule.backupTypes, type]
                              : schedule.backupTypes.filter(t => t !== type);
                            setSchedule({ ...schedule, backupTypes: types });
                          }}
                          className="w-4 h-4 rounded border-zinc-300 text-cyan-600"
                        />
                        <span className="text-sm capitalize">{type === 'full' ? 'Complet' : type === 'database' ? 'Base de données' : 'Fichiers'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cloud size={20} className="text-cyan-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Destination</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Stockage</label>
                  <select
                    value={schedule.destination}
                    onChange={(e) => setSchedule({ ...schedule, destination: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  >
                    <option value="local">Local (serveur)</option>
                    <option value="s3">Amazon S3</option>
                    <option value="google">Google Cloud Storage</option>
                    <option value="dropbox">Dropbox</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Rétention (jours)</label>
                  <input
                    type="number"
                    value={schedule.retentionDays}
                    onChange={(e) => setSchedule({ ...schedule, retentionDays: parseInt(e.target.value) })}
                    min={1}
                    max={365}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.emailNotification}
                    onChange={(e) => setSchedule({ ...schedule, emailNotification: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 text-cyan-600"
                  />
                  <span className="text-sm">Recevoir une notification par email</span>
                </label>
                
                <button className="w-full mt-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors">
                  Sauvegarder la planification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={20} className="text-cyan-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Chiffrement</h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-300 text-cyan-600" />
                  <span className="text-sm">Activer le chiffrement AES-256</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-300 text-cyan-600" />
                  <span className="text-sm">Chiffrer avant transfert</span>
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server size={20} className="text-cyan-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Exclusions</h3>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Dossier/fichier à exclure"
                    className="flex-1 p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                  <button className="p-2.5 bg-cyan-600 text-white rounded-xl">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <code className="text-xs">node_modules/</code>
                    <button className="text-red-500 hover:text-red-700">
                      <XCircle size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <code className="text-xs">.env</code>
                    <button className="text-red-500 hover:text-red-700">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore Tab */}
        {activeTab === "restore" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw size={20} className="text-amber-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Restauration rapide</h3>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Sélectionnez une sauvegarde pour restaurer vos données. Cette action est irréversible.
              </p>
              <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm mb-4">
                <option>Sélectionner une sauvegarde</option>
                {backups.filter(b => b.status === 'completed').map(b => (
                  <option key={b.id}>{b.name} - {formatDate(b.createdAt)}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors">
                  Restaurer la sauvegarde
                </button>
                <button className="py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <Upload size={18} />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <History size={20} className="text-cyan-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Historique des restaurations</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">backup_full_2024-03-28</p>
                      <p className="text-xs text-zinc-500">Restauré le 28/03/2024 par Admin</p>
                    </div>
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">backup_database_2024-03-25</p>
                      <p className="text-xs text-zinc-500">Restauré le 25/03/2024 par Système</p>
                    </div>
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}