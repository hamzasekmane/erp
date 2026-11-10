// app/dashboard/settings/users/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Key,
  Lock,
  Smartphone,
  Globe,
  Activity,
  FileText,
  CreditCard,
  Users,
  AlertCircle,
  RefreshCw,
  Save,
  X
} from "lucide-react";
import Link from "next/link";
import { settingsService } from "@/app/services/settingsService";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Velora ERP | Détails de l'utilisateur`,
    description: `Gestion de l'utilisateur ${id}`,
  };
}

export default async function UserDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // Récupérer les détails de l'utilisateur
  const usersRes = await settingsService.getUsers(token);
  const users = usersRes?.success && usersRes.data ? usersRes.data : [];
  const user = users.find((u: any) => u._id === id);

  if (!user) {
    notFound();
  }

  // Récupérer les tenants pour l'affichage
  const tenantsRes = await settingsService.getAllTenants(token);
  const tenants = tenantsRes?.success && tenantsRes.data ? tenantsRes.data : [];
  const tenant = tenants.find((t: any) => t._id === user.tenantId);

  // ✅ Correction: Fonction de formatage avec gestion de undefined
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Jamais';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // ✅ Correction: Fonction pour la date courte (sans heure)
  const formatShortDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Jamais';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return { color: 'purple', text: 'ADMINISTRATEUR', icon: Shield, description: 'Accès complet à toutes les fonctionnalités' };
      case 'manager':
        return { color: 'blue', text: 'MANAGER', icon: Users, description: 'Gestion des équipes et rapports' };
      default:
        return { color: 'slate', text: 'UTILISATEUR', icon: User, description: 'Accès limité aux fonctionnalités de base' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return { color: 'emerald', icon: CheckCircle, text: 'ACTIF', description: 'Compte actif et opérationnel' };
      case 'suspended':
        return { color: 'amber', icon: Clock, text: 'SUSPENDU', description: 'Compte temporairement désactivé' };
      default:
        return { color: 'rose', icon: XCircle, text: 'INACTIF', description: 'Compte désactivé' };
    }
  };

  const roleInfo = getRoleBadge(user.role);
  const statusInfo = getStatusBadge(user.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings/users"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </Link>
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-2xl flex items-center justify-center">
                <User size={24} className="text-[var(--accent)]" />
              </div>
              {user.status === 'active' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[var(--background)] animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • USER_MANAGEMENT
                </span>
                <span
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border bg-${statusInfo.color}-500/20 text-${statusInfo.color}-500 border-${statusInfo.color}-500/30`}
                >
                  {statusInfo.text}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                {user.name}
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                ID: {user._id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/settings/users/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-300 group"
          >
            <Edit size={14} className="group-hover:scale-110 transition-transform" />
            Modifier
          </Link>
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 group"
          >
            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
            Supprimer
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Role Card */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className={`p-2 bg-${roleInfo.color}-500/10 rounded-lg group-hover:scale-110 transition-transform`}>
              <roleInfo.icon size={16} className={`text-${roleInfo.color}-500`} />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">ROLE</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Rôle</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{roleInfo.text}</p>
          <p className="text-[8px] text-[var(--foreground-muted)]">{roleInfo.description}</p>
        </div>

        {/* Status Card */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className={`p-2 bg-${statusInfo.color}-500/10 rounded-lg group-hover:scale-110 transition-transform`}>
              <statusInfo.icon size={16} className={`text-${statusInfo.color}-500`} />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">STATUS</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Statut</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{statusInfo.text}</p>
          <p className="text-[8px] text-[var(--foreground-muted)]">{statusInfo.description}</p>
        </div>

        {/* Tenant Card */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
              <Building2 size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">TENANT</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Organisation</p>
          <p className="text-xl font-black text-[var(--foreground)] truncate">
            {tenant?.name || 'Principal'}
          </p>
          <p className="text-[8px] text-[var(--foreground-muted)]">
            {tenant?.subdomain || 'main'}.velora.com
          </p>
        </div>

        {/* Last Active Card - ✅ Correction ici */}
        <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
              <Activity size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--accent)]">ACTIVITY</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Dernière activité</p>
          <p className="text-xl font-black text-[var(--accent)]">
            {formatDate(user.lastLogin)}
          </p>
          <p className="text-[8px] text-[var(--foreground-muted)]">
            Compte créé le {formatShortDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* MAIN CONTENT - 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN - Informations personnelles */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <User size={16} className="text-[var(--accent)]" />
              </div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                Informations personnelles
              </h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <User size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-mono text-[var(--foreground-muted)]">Nom complet</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{user.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-mono text-[var(--foreground-muted)]">Email</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{user.email}</p>
              </div>
            </div>
            {user.phone && (
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">Téléphone</p>
                  <p className="text-sm font-bold text-[var(--foreground)]">{user.phone}</p>
                </div>
              </div>
            )}
            {user.department && (
              <div className="flex items-start gap-3">
                <Building2 size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">Département</p>
                  <p className="text-sm font-bold text-[var(--foreground)]">{user.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Sécurité & Accès */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <Lock size={16} className="text-[var(--accent)]" />
              </div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                Sécurité & Accès
              </h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Shield size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-mono text-[var(--foreground-muted)]">Permissions</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-${roleInfo.color}-500/10 text-${roleInfo.color}-500`}>
                    {roleInfo.text}
                  </span>
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-purple-500/10 text-purple-500">
                      Toutes les permissions
                    </span>
                  )}
                  {user.role === 'manager' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-blue-500/10 text-blue-500">
                      Gestion d'équipe
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Key size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-mono text-[var(--foreground-muted)]">Authentification</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--foreground)]">2FA</span>
                  <span className="text-[8px] text-[var(--foreground-muted)]">•</span>
                  <span className="text-[10px] text-[var(--foreground)]">Session sécurisée</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-mono text-[var(--foreground-muted)]">Activité récente</p>
                <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
                  Dernière connexion: {formatDate(user.lastLogin)}
                </p>
                <p className="text-[10px] text-[var(--foreground-muted)]">
                  Membre depuis: {formatShortDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS SECTION */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <Activity size={16} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
              Actions rapides
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            {user.status === 'active' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase text-amber-500 hover:bg-amber-500 hover:text-white transition-all">
                <Clock size={12} />
                Suspendre le compte
              </button>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                <CheckCircle size={12} />
                Réactiver le compte
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg text-[10px] font-black uppercase text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all">
              <Key size={12} />
              Réinitialiser le mot de passe
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[10px] font-black uppercase text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
              <RefreshCw size={12} />
              Journal d'activité
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
        <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
          Velora ERP • User Management System • v2.0.0
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
            RBAC: Role-Based Access Control • Audit trail disponible
          </span>
        </div>
      </div>
    </div>
  );
}