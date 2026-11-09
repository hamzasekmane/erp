// app/components/settings/TenantUsers.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { settingsService } from "@/app/services/settingsService";

interface TenantUsersProps {
  tenantId: string;
  token: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
  phone?: string;
  department?: string;
}

export function TenantUsers({ tenantId, token }: TenantUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [endpointError, setEndpointError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setEndpointError(false);
    try {
      const response = await settingsService.getTenantUsers(token, tenantId);
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data) ? response.data : [];
        setUsers(usersData);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setEndpointError(true);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return { color: 'emerald', icon: CheckCircle, text: 'ACTIF' };
      case 'inactive':
        return { color: 'slate', icon: Clock, text: 'INACTIF' };
      case 'suspended':
        return { color: 'rose', icon: XCircle, text: 'SUSPENDU' };
      default:
        return { color: 'slate', icon: Clock, text: 'INCONNU' };
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return { color: 'purple', text: 'ADMIN', icon: Shield };
      case 'manager':
        return { color: 'blue', text: 'MANAGER', icon: UserCheck };
      case 'user':
        return { color: 'slate', text: 'UTILISATEUR', icon: Users };
      default:
        return { color: 'slate', text: role?.toUpperCase() || 'INCONNU', icon: Users };
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length
  };

  // Afficher un message si l'endpoint n'est pas disponible
  if (endpointError && !isLoading) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <Users size={16} className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                Utilisateurs du tenant
              </h2>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                Gestion des utilisateurs
              </p>
            </div>
          </div>
        </div>
        <div className="p-12 text-center">
          <Users size={48} className="mx-auto text-[var(--foreground-muted)] opacity-30" />
          <p className="text-sm text-[var(--foreground-muted)] mt-4">
            Module utilisateur en cours de développement
          </p>
          <p className="text-xs text-[var(--foreground-muted)]/60 mt-1">
            L'API de gestion des utilisateurs sera bientôt disponible
          </p>
          <button
            onClick={fetchUsers}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/20 transition-colors"
          >
            <RefreshCw size={12} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <Users size={16} className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                Utilisateurs du tenant
              </h2>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                {stats.total} utilisateur{stats.total > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={16} className="text-[var(--foreground-muted)]" />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 transition-all duration-300"
            >
              <UserPlus size={14} />
              Inviter
            </button>
          </div>
        </div>

        {/* Filters - uniquement si des utilisateurs existent */}
        {users.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateurs</option>
                <option value="manager">Managers</option>
                <option value="user">Utilisateurs</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="suspended">Suspendus</option>
              </select>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-2 bg-[var(--background)]/50 rounded-lg text-center">
                <p className="text-[8px] font-mono text-[var(--foreground-muted)]">TOTAL</p>
                <p className="text-lg font-black text-[var(--foreground)]">{stats.total}</p>
              </div>
              <div className="p-2 bg-emerald-500/5 rounded-lg text-center">
                <p className="text-[8px] font-mono text-emerald-500">ACTIFS</p>
                <p className="text-lg font-black text-emerald-500">{stats.active}</p>
              </div>
              <div className="p-2 bg-purple-500/5 rounded-lg text-center">
                <p className="text-[8px] font-mono text-purple-500">ADMINS</p>
                <p className="text-lg font-black text-purple-500">{stats.admins}</p>
              </div>
              <div className="p-2 bg-blue-500/5 rounded-lg text-center">
                <p className="text-[8px] font-mono text-blue-500">MANAGERS</p>
                <p className="text-lg font-black text-blue-500">{stats.managers}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-xs text-[var(--foreground-muted)] mt-2">Chargement...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="mx-auto text-[var(--foreground-muted)] opacity-30" />
            <p className="text-sm text-[var(--foreground-muted)] mt-2">Aucun utilisateur trouvé</p>
            <p className="text-xs text-[var(--foreground-muted)]/60 mt-1">
              Commencez par inviter des utilisateurs
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Search size={32} className="mx-auto text-[var(--foreground-muted)] opacity-30" />
            <p className="text-sm text-[var(--foreground-muted)] mt-2">Aucun résultat</p>
            <p className="text-xs text-[var(--foreground-muted)]/60 mt-1">
              Aucun utilisateur ne correspond à vos critères
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <th className="p-4 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Utilisateur</th>
                <th className="p-4 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Rôle</th>
                <th className="p-4 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Contact</th>
                <th className="p-4 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Statut</th>
                <th className="p-4 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Dernière activité</th>
                <th className="p-4 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.map((user) => {
                const StatusBadge = getStatusBadge(user.status);
                const RoleBadge = getRoleBadge(user.role);
                return (
                  <tr key={user._id} className="hover:bg-[var(--background)]/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl flex items-center justify-center font-black text-[var(--accent)] text-lg">
                          {user.name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--foreground)]">{user.name}</p>
                          <p className="text-[9px] font-mono text-[var(--foreground-muted)]">ID: {user._id?.slice(-8)}</p>
                        </div>
                      </div>
                     </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-purple-500/10 text-purple-500">
                        <RoleBadge.icon size={10} />
                        {RoleBadge.text}
                      </div>
                     </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Mail size={10} className="text-[var(--foreground-muted)]" />
                        <span className="text-[11px] text-[var(--foreground)]">{user.email}</span>
                      </div>
                     </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge.icon size={10} className={`text-${StatusBadge.color}-500`} />
                        <span className={`text-[10px] font-black text-${StatusBadge.color}-500`}>
                          {StatusBadge.text}
                        </span>
                      </div>
                     </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={10} className="text-[var(--foreground-muted)]" />
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                        </span>
                      </div>
                     </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                          <Edit size={14} className="text-[var(--foreground-muted)]" />
                        </button>
                        <button className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors">
                          <Trash2 size={14} className="text-[var(--foreground-muted)]" />
                        </button>
                      </div>
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal - À implémenter */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl">
            <div className="p-5 border-b border-[var(--border)]">
              <h3 className="text-lg font-black text-[var(--foreground)]">Inviter un utilisateur</h3>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono mt-1">
                Fonctionnalité à venir
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-[var(--foreground-muted)] text-center">
                L'invitation d'utilisateurs sera disponible prochainement.
              </p>
              <button
                onClick={() => setShowInviteModal(false)}
                className="mt-4 w-full px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}