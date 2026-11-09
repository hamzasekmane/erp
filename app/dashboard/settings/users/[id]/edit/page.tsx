// app/dashboard/settings/users/[id]/edit/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  User,
  ArrowLeft,
  Save,
  X,
  Shield,
  Mail,
  Phone,
  Building2,
  Key,
  Lock,
  AlertCircle,
  CheckCircle,
  Users,
  Eye,
  EyeOff,
  XCircle,
    Clock,
    Activity
} from "lucide-react";
import Link from "next/link";
import { settingsService } from "@/app/services/settingsService";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Velora ERP | Modifier l'utilisateur`,
    description: `Modification de l'utilisateur ${id}`,
  };
}

export default async function EditUserPage({ params }: PageProps) {
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

  // Récupérer les tenants pour le sélecteur
  const tenantsRes = await settingsService.getAllTenants(token);
  const tenants = tenantsRes?.success && tenantsRes.data ? tenantsRes.data : [];

  const roles = [
    { value: "admin", label: "Administrateur", description: "Accès complet à toutes les fonctionnalités", icon: Shield, color: "purple" },
    { value: "manager", label: "Manager", description: "Gestion des équipes et rapports", icon: Users, color: "blue" },
    { value: "user", label: "Utilisateur", description: "Accès limité aux fonctionnalités de base", icon: User, color: "slate" }
  ];

  const statuses = [
    { value: "active", label: "Actif", description: "Compte actif et opérationnel", color: "emerald" },
    { value: "inactive", label: "Inactif", description: "Compte désactivé", color: "rose" },
    { value: "suspended", label: "Suspendu", description: "Compte temporairement désactivé", color: "amber" }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/settings/users/${id}`}
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <User size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • USER_MANAGEMENT
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  ● EDIT_MODE
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Modifier l'utilisateur
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                {user.name} • {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/settings/users/${id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] transition-all duration-300"
          >
            <X size={14} />
            Annuler
          </Link>
          <button
            type="submit"
            form="edit-user-form"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-[var(--accent)]/20"
          >
            <Save size={14} />
            Enregistrer
          </button>
        </div>
      </div>

      {/* FORM */}
      <form id="edit-user-form" action="/api/settings/users/update" method="POST" className="max-w-4xl mx-auto space-y-6">
        <input type="hidden" name="userId" value={user._id} />
        
        {/* Informations générales */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <User size={16} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                  Informations générales
                </h2>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                  Modifiez les informations de base de l'utilisateur
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nom complet */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <User size={12} /> Nom complet *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user.name}
                  required
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Mail size={12} /> Email *
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  required
                  placeholder="jean@entreprise.com"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Phone size={12} /> Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={user.phone || ""}
                  placeholder="+33 1 23 45 67 89"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>

              {/* Département */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={12} /> Département
                </label>
                <input
                  type="text"
                  name="department"
                  defaultValue={user.department || ""}
                  placeholder="IT, RH, Finance..."
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rôle & Permissions */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <Shield size={16} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                  Rôle & Permissions
                </h2>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                  Définissez les permissions et le niveau d'accès
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-5">
              {/* Rôle */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Shield size={12} /> Rôle utilisateur *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        user.role === role.value
                          ? `border-${role.color}-500 bg-${role.color}-500/10`
                          : "border-[var(--border)] hover:border-[var(--accent)]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        defaultChecked={user.role === role.value}
                        className="sr-only"
                      />
                      <div className="flex flex-col gap-2">
                        <div className={`p-2 w-fit rounded-lg bg-${role.color}-500/10`}>
                          <role.icon size={16} className={`text-${role.color}-500`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--foreground)]">{role.label}</p>
                          <p className="text-[9px] text-[var(--foreground-muted)]">{role.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statut du compte */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <Lock size={16} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                  Statut du compte
                </h2>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                  Activez, désactivez ou suspendez le compte utilisateur
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Activity size={12} /> Statut *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {statuses.map((status) => (
                    <label
                      key={status.value}
                      className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        user.status === status.value
                          ? `border-${status.color}-500 bg-${status.color}-500/10`
                          : "border-[var(--border)] hover:border-[var(--accent)]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        defaultChecked={user.status === status.value}
                        className="sr-only"
                      />
                      <div className="flex flex-col gap-2">
                        <div className={`p-2 w-fit rounded-lg bg-${status.color}-500/10`}>
                          {status.value === 'active' && <CheckCircle size={16} className={`text-${status.color}-500`} />}
                          {status.value === 'inactive' && <XCircle size={16} className={`text-${status.color}-500`} />}
                          {status.value === 'suspended' && <Clock size={16} className={`text-${status.color}-500`} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--foreground)]">{status.label}</p>
                          <p className="text-[9px] text-[var(--foreground-muted)]">{status.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant (si admin) */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <Building2 size={16} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                  Organisation
                </h2>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                  Associez l'utilisateur à une organisation (tenant)
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Building2 size={12} /> Tenant / Organisation
              </label>
              <select
                name="tenantId"
                defaultValue={user.tenantId || ""}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="">Tenant principal</option>
                {tenants.map((tenant: any) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} ({tenant.subdomain}.velora.com)
                  </option>
                ))}
              </select>
              <p className="text-[8px] text-[var(--foreground-muted)] font-mono">
                Laissez vide pour le tenant principal
              </p>
            </div>
          </div>
        </div>

        {/* Security Section - Mot de passe */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <Key size={16} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                  Sécurité
                </h2>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                  Gérez le mot de passe et la sécurité du compte
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Lock size={12} /> Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                <p className="text-[8px] text-[var(--foreground-muted)] font-mono">
                  Laissez vide pour conserver le mot de passe actuel
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Lock size={12} /> Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Information</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">
                    L'utilisateur recevra un email de confirmation si le mot de passe est modifié.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

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