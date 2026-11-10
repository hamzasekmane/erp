import { cookies } from "next/headers";
import { Metadata } from "next";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
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
  Download,
  UserCheck,
  UserX,
  Lock,
  Key,
  Activity,
  BarChart3,
  Building2,
  Globe,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { settingsService } from "@/app/services/settingsService";

export const metadata: Metadata = {
  title: "Velora ERP | Gestion des utilisateurs",
  description: "Gestion centralisée des utilisateurs et permissions",
};

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  
  // Récupérer la liste des utilisateurs
  const usersRes = await settingsService.getUsers(token);
  const users = usersRes?.success && usersRes.data ? usersRes.data : [];
  
  // Récupérer les tenants pour le filtre (si admin)
  const tenantsRes = await settingsService.getAllTenants(token);
  const tenants = tenantsRes?.success && tenantsRes.data ? tenantsRes.data : [];
  
  // Statistiques
  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.status === 'active').length;
  const adminUsers = users.filter((u: any) => u.role === 'admin').length;
  const managerUsers = users.filter((u: any) => u.role === 'manager').length;
  
  // Calcul des pourcentages
  const activePercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/dashboard/settings"
          className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
        >
          <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
        </Link>
        <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
          <Users size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              VaLORA • USER_MANAGEMENT
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              ● ACTIVE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Gestion des <span className="text-[var(--accent)]">Utilisateurs</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Gérez les comptes utilisateurs, rôles et permissions
          </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
              <Users size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_01</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Total Utilisateurs</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{totalUsers}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[var(--accent)] rounded-full" />
          </div>
        </div>

        {/* Active Users */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle size={16} className="text-emerald-500" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_02</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Utilisateurs Actifs</p>
          <p className="text-2xl font-black text-emerald-500">{activeUsers}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </div>

        {/* Administrators */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-purple-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Shield size={16} className="text-purple-500" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_03</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Administrateurs</p>
          <p className="text-2xl font-black text-purple-500">{adminUsers}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-full h-full bg-purple-500 rounded-full" />
          </div>
        </div>

        {/* Managers */}
        <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <UserCheck size={16} className="text-blue-500" />
            </div>
            <span className="text-[8px] font-mono text-[var(--accent)]">LIVE</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Managers</p>
          <p className="text-2xl font-black text-blue-500">{managerUsers}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-4/5 h-full bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]/50 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
              <Filter size={14} className="text-[var(--accent)]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-tight">
                Liste des utilisateurs
              </span>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors w-48"
              />
            </div>
            
            {/* Filter by role */}
            <select className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none">
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="manager">Managers</option>
              <option value="user">Utilisateurs</option>
            </select>
            
            {/* Filter by status */}
            <select className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none">
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="suspended">Suspendus</option>
            </select>
            
            <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
              <RefreshCw size={14} className="text-[var(--foreground-muted)]" />
            </button>
            <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
              <Download size={14} className="text-[var(--foreground-muted)]" />
            </button>
          </div>
        </div>

        {totalUsers > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Utilisateur</th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Rôle</th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Contact</th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Tenant</th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-center">Statut</th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">Dernière activité</th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map((user: any) => (
                  <tr 
                    key={user._id} 
                    className="hover:bg-[var(--background)]/50 transition-colors group"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl flex items-center justify-center font-black text-[var(--accent)] text-lg">
                            {user.name?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          {user.status === 'active' && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[var(--card-bg)]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                            {user.name}
                          </p>
                          <p className="text-[9px] font-mono text-[var(--foreground-muted)]">
                            ID: {user._id?.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' 
                          : user.role === 'manager'
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}>
                        {user.role === 'admin' ? <Shield size={10} /> : user.role === 'manager' ? <UserCheck size={10} /> : <Users size={10} />}
                        {user.role === 'admin' ? 'ADMIN' : user.role === 'manager' ? 'MANAGER' : 'USER'}
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail size={10} className="text-[var(--foreground-muted)]" />
                          <span className="text-[11px] text-[var(--foreground)]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={10} className="text-[var(--foreground-muted)]" />
                            <span className="text-[10px] text-[var(--foreground-muted)]">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={10} className="text-[var(--foreground-muted)]" />
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                          {user.tenantId ? user.tenantId.slice(-8) : 'Principal'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex justify-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          user.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : user.status === 'suspended'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {user.status === 'active' ? (
                            <CheckCircle size={10} />
                          ) : user.status === 'suspended' ? (
                            <Clock size={10} />
                          ) : (
                            <XCircle size={10} />
                          )}
                          {user.status === 'active' ? 'ACTIF' : user.status === 'suspended' ? 'SUSPENDU' : 'INACTIF'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={10} className="text-[var(--foreground-muted)]" />
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/dashboard/settings/users/${user._id}`}
                          className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors group/btn"
                        >
                          <Edit size={14} className="text-[var(--foreground-muted)] group-hover/btn:text-[var(--accent)]" />
                        </Link>
                        <button className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors group/btn">
                          <Trash2 size={14} className="text-[var(--foreground-muted)] group-hover/btn:text-rose-500" />
                        </button>
                        <button className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors group/btn">
                          <Lock size={14} className="text-[var(--foreground-muted)] group-hover/btn:text-amber-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-transparent rounded-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center border-2 border-[var(--border)]">
                <Users size={32} className="text-[var(--foreground-muted)]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                Aucun utilisateur trouvé
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-2 font-mono">
                Commencez par créer votre premier utilisateur
              </p>
            </div>
            <Link 
              href="/dashboard/settings/users/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--accent)] text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 transition-all duration-300"
            >
              <UserPlus size={14} />
              Créer un utilisateur
            </Link>
          </div>
        )}
      </div>

      {/* FOOTER INFO */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
        <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
          Valora ERP • User Management System • v2.0.0
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
            RBAC: Role-Based Access Control
          </span>
        </div>
      </div>
    </div>
  );
}