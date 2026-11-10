import { Metadata } from "next";
import Link from "next/link";
import {
  Settings,
  Building2,
  CreditCard,
  Bell,
  Users,
  Shield,
  Receipt,
  FileJson,
  Key,
  ChevronRight,
  Sparkles,
  Database,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  BookOpen,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Velora ERP | Paramètres",
  description: "Gérez les paramètres de votre compte et de votre entreprise",
};

interface SettingsSection {
  title: string;
  icon: React.ElementType;
  href: string;
  description: string;
  color: string;
  items?: { label: string; href: string; icon: React.ElementType }[];
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  const settingsSections: SettingsSection[] = [
    {
      title: "Société",
      icon: Building2,
      href: "/dashboard/settings/company",
      description: "Informations de l'entreprise, logo, coordonnées",
      color: "from-blue-500/20 to-blue-500/5",
    },
    {
      title: "Paiement",
      icon: CreditCard,
      href: "/dashboard/settings/payment",
      description: "Méthodes de paiement, facturation, abonnements",
      color: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      title: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      description: "Alertes, emails, rappels, notifications push",
      color: "from-amber-500/20 to-amber-500/5",
    },
    {
      title: "Utilisateurs",
      icon: Users,
      href: "/dashboard/settings/users",
      description: "Gestion des utilisateurs, rôles et permissions",
      color: "from-purple-500/20 to-purple-500/5",
    },
    {
      title: "Locataires",
      icon: Shield,
      href: "/dashboard/settings/tenants",
      description: "Gestion des locataires (multi-tenant)",
      color: "from-red-500/20 to-red-500/5",
    },
    {
      title: "Facturation",
      icon: Receipt,
      href: "/dashboard/settings/billing",
      description: "Factures, devis, historique de paiement",
      color: "from-cyan-500/20 to-cyan-500/5",
    },
    {
      title: "API",
      icon: FileJson,
      href: "/dashboard/settings/api",
      description: "Clés API, webhooks, intégrations",
      color: "from-indigo-500/20 to-indigo-500/5",
    },
    {
      title: "Sécurité",
      icon: Key,
      href: "/dashboard/settings/security",
      description: "Mots de passe, 2FA, sessions, logs",
      color: "from-rose-500/20 to-rose-500/5",
    },
  ];

  const quickActions = [
    { label: "Profil de l'entreprise", href: "/dashboard/settings/company", icon: Building2 },
    { label: "Méthodes de paiement", href: "/dashboard/settings/payment", icon: CreditCard },
    { label: "Gérer les utilisateurs", href: "/dashboard/settings/users", icon: Users },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
                <Settings size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    Valora • SETTINGS
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    ● PREFERENCES
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Paramètres & <span className="text-[var(--accent)]">Configuration</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                  Gérez tous les aspects de votre plateforme
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-center">
              <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Version</p>
              <p className="text-sm font-black text-[var(--accent)]">v2.0.0</p>
            </div>
            <div className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-center">
              <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Environnement</p>
              <p className="text-sm font-black text-emerald-500">Production</p>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS BAR */}
        <div className="flex flex-wrap gap-2 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl">
          <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider mr-2 self-center">
            Actions rapides :
          </span>
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all"
            >
              <action.icon size={14} className="text-[var(--accent)]" />
              {action.label}
            </Link>
          ))}
        </div>

        {/* MAIN GRID - SETTINGS SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className="group relative overflow-hidden bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--accent)]/5"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-xl bg-[var(--accent)]/10 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={22} className="text-[var(--accent)]" />
                    </div>
                    <ChevronRight size={18} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-black text-[var(--foreground)] mb-2">
                    {section.title}
                  </h3>
                  
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {section.description}
                  </p>

                  {/* Sub-items indicator */}
                  {section.items && section.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <p className="text-[10px] text-[var(--foreground-muted)] mb-2">
                        {section.items.length} options disponibles
                      </p>
                      <div className="flex gap-2">
                        {section.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-lg bg-[var(--accent)]/5 flex items-center justify-center">
                            <item.icon size={12} className="text-[var(--foreground-muted)]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* SYSTEM INFO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* System Status */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Database size={18} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-black">État du système</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--foreground-muted)]">API Status</span>
                <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Opérationnel
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--foreground-muted)]">Base de données</span>
                <span className="text-xs font-medium text-emerald-500">Connectée</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--foreground-muted)]">Cache</span>
                <span className="text-xs font-medium text-emerald-500">Actif</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--foreground-muted)]">Files d'attente</span>
                <span className="text-xs font-medium text-amber-500">2 traitements</span>
              </div>
            </div>
          </div>

          {/* Support & Resources */}
<div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-blue-500/10 rounded-lg">
      <Sparkles size={18} className="text-blue-500" />
    </div>
    <h3 className="text-base font-black">Support & Ressources</h3>
  </div>
  <div className="space-y-3">
    <Link href="/dashboard/support/documentation" className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors group">
      <div className="flex items-center gap-3">
        <BookOpen size={16} className="text-blue-500" />
        <span className="text-sm">Documentation</span>
      </div>
      <ArrowRight size={14} className="text-[var(--foreground-muted)] group-hover:translate-x-1 transition-transform" />
    </Link>
    
    <Link href="/dashboard/support/technical" className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors group">
      <div className="flex items-center gap-3">
        <MessageCircle size={16} className="text-purple-500" />
        <span className="text-sm">Support technique</span>
      </div>
      <ArrowRight size={14} className="text-[var(--foreground-muted)] group-hover:translate-x-1 transition-transform" />
    </Link>
    
    <Link href="/dashboard/support/contact" className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors group">
      <div className="flex items-center gap-3">
        <Phone size={16} className="text-green-500" />
        <span className="text-sm">Contacter le support</span>
      </div>
      <ArrowRight size={14} className="text-[var(--foreground-muted)] group-hover:translate-x-1 transition-transform" />
    </Link>
    
    <Link href="/dashboard/support/changelog" className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors group">
      <div className="flex items-center gap-3">
        <RefreshCw size={16} className="text-amber-500" />
        <span className="text-sm">Nouveautés (Changelog)</span>
      </div>
      <ArrowRight size={14} className="text-[var(--foreground-muted)] group-hover:translate-x-1 transition-transform" />
    </Link>
  </div>
</div>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center pt-6">
          <p className="text-[10px] text-[var(--foreground-muted)] font-mono">
            Les modifications sont enregistrées automatiquement • Support disponible 24/7
          </p>
        </div>
      </div>
    </div>
  );
}