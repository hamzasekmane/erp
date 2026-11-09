import { cookies } from "next/headers";
import { settingsService } from "@/app/services/settingsService";
import { 
  Shield, 
  LayoutGrid, 
  Activity, 
  ExternalLink, 
  Building2, 
  Database, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Velora ERP | Gestion des Tenants",
  description: "Gestion centralisée des locataires et organisations",
};

export default async function TenantsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const tenantsRes = await settingsService.getAllTenants(token);
  
  // ✅ Correction : Extraire correctement le tableau des tenants
  let tenants: any[] = [];
  if (tenantsRes?.success && tenantsRes?.data) {
    if (Array.isArray(tenantsRes.data)) {
      tenants = tenantsRes.data;
    } else if (tenantsRes.data.tenants && Array.isArray(tenantsRes.data.tenants)) {
      tenants = tenantsRes.data.tenants;
    }
  }
  
  // Calcul des statistiques
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t: any) => t.status === 'active').length;
  const inactiveTenants = tenants.filter((t: any) => t.status !== 'active').length;
  const suspendedTenants = tenants.filter((t: any) => t.status === 'suspended').length;
  const totalUsers = tenants.reduce((acc: number, t: any) => acc + (t.userCount || 0), 0);
  
  // Calcul des pourcentages pour les barres de progression
  const activePercentage = totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0;
  const inactivePercentage = totalTenants > 0 ? (inactiveTenants / totalTenants) * 100 : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/dashboard/settings"
          className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
        >
          <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
        </Link>
        <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
          <Building2 size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              VELORA • MULTI_TENANCY
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              ● SAAS_MODE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Gestion des <span className="text-[var(--accent)]">Tenants</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Gérez toutes les organisations et leurs abonnements
          </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
              <Building2 size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_01</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Total Tenants</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{totalTenants}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[var(--accent)] rounded-full" />
          </div>
        </div>

        {/* Active Tenants */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle size={16} className="text-emerald-500" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_02</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Actifs</p>
          <p className="text-2xl font-black text-emerald-500">{activeTenants}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </div>

        {/* Inactive/Suspended Tenants */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-rose-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-rose-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <XCircle size={16} className="text-rose-500" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_03</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Inactifs/Suspendus</p>
          <p className="text-2xl font-black text-rose-500">{inactiveTenants}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full" 
              style={{ width: `${inactivePercentage}%` }}
            />
          </div>
        </div>

        {/* Total Users */}
        <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
              <Users size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--accent)]">LIVE</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Utilisateurs totaux</p>
          <p className="text-2xl font-black text-[var(--accent)]">{totalUsers}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-4/5 h-full bg-[var(--accent)] rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* TENANTS TABLE */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]/50 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
              <LayoutGrid size={14} className="text-[var(--accent)]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-tight">
                Liste des organisations
              </span>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                {totalTenants} tenant{totalTenants > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <form action="/dashboard/settings/tenants">
              <button type="submit" className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                <RefreshCw size={14} className="text-[var(--foreground-muted)]" />
              </button>
            </form>
          </div>
        </div>

        {totalTenants > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">
                    Organisation
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">
                    Abonnement
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-left">
                    Date création
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-center">
                    Statut
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase text-[var(--foreground-muted)] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {tenants.map((tenant: any) => (
                  <tr 
                    key={tenant._id} 
                    className="hover:bg-[var(--background)]/50 transition-colors group"
                  >
                    <td className="p-5">
                      <Link 
                        href={`/dashboard/settings/tenants/${tenant._id}`}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl flex items-center justify-center font-black text-[var(--accent)] text-lg">
                            {tenant.name?.substring(0, 2).toUpperCase() || 'TE'}
                          </div>
                          {tenant.status === 'active' && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[var(--card-bg)]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                            {tenant.name}
                          </p>
                          <p className="text-[9px] font-mono text-[var(--foreground-muted)]">
                            {tenant.subdomain}.velora.com
                          </p>
                          {tenant.email && (
                            <p className="text-[8px] text-[var(--foreground-muted)] mt-0.5 truncate max-w-[200px]">
                              {tenant.email}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg inline-block w-fit">
                          {tenant.plan || 'Standard'}
                        </span>
                        {tenant.subscriptionEnd && (
                          <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
                            expire le {new Date(tenant.subscriptionEnd).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-[var(--foreground-muted)]" />
                        <span className="text-[11px] font-mono text-[var(--foreground-muted)]">
                          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex justify-center">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          tenant.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : tenant.status === 'suspended'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {tenant.status === 'active' ? (
                            <CheckCircle size={10} />
                          ) : tenant.status === 'suspended' ? (
                            <Clock size={10} />
                          ) : (
                            <XCircle size={10} />
                          )}
                          {tenant.status === 'active' ? 'ACTIF' : tenant.status === 'suspended' ? 'SUSPENDU' : 'INACTIF'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/dashboard/settings/tenants/${tenant._id}`}
                          className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors group/btn"
                        >
                          <ExternalLink size={16} className="text-[var(--foreground-muted)] group-hover/btn:text-[var(--accent)]" />
                        </Link>
                        <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors group/btn">
                          <Copy size={14} className="text-[var(--foreground-muted)] group-hover/btn:text-[var(--accent)]" />
                        </button>
                        <button className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors group/btn">
                          <Edit size={14} className="text-[var(--foreground-muted)] group-hover/btn:text-amber-500" />
                        </button>
                        <button className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors group/btn">
                          <Trash2 size={14} className="text-[var(--foreground-muted)] group-hover/btn:text-rose-500" />
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
                <Building2 size={32} className="text-[var(--foreground-muted)]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                Aucun tenant trouvé
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-2 font-mono">
                Commencez par créer votre première organisation
              </p>
            </div>
            <Link 
              href="/dashboard/settings/tenants/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--accent)] text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 transition-all duration-300"
            >
              <Shield size={14} />
              Créer un tenant
            </Link>
          </div>
        )}
      </div>

      {/* FOOTER INFO */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
        <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
          Velora ERP • Multi-tenancy Architecture • v2.0.0
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
            Base de données: PostgreSQL • Isolation: Schéma par tenant
          </span>
        </div>
      </div>
    </div>
  );
}