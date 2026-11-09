// app/dashboard/settings/company/page.tsx
import { cookies } from "next/headers";
import { Metadata } from "next";
import {
  Building2,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Database,
  Users,
  HardDrive,
  Activity,
  Settings,
  Shield,
  Bell,
  Zap
} from "lucide-react";
import Link from "next/link";
import { settingsService } from "@/app/services/settingsService";
import { CompanyClient } from "./CompanyClient";

export const metadata: Metadata = {
  title: "Velora ERP | Paramètres de l'entreprise",
  description: "Gestion des informations et paramètres de l'entreprise",
};

export default async function CompanySettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // Récupérer les informations du tenant (entreprise)
  const tenantRes = await settingsService.getTenantInfo(token);
  const company = tenantRes?.success && tenantRes.data ? tenantRes.data : null;

  // Récupérer les métriques système
  const metricsRes = await settingsService.getSystemMetrics(token);
  const metrics = metricsRes?.success && metricsRes.data ? metricsRes.data : {};

  // ✅ Correction: Interface complète avec toutes les propriétés
  interface CompanyData {
    _id: string;
    name: string;
    businessName: string;
    subdomain: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    taxNumber: string;
    tvaIntra: string;
    logo: string | null;
    currency: string;
    language: string;
    timezone: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }

  // ✅ Valeurs par défaut avec toutes les propriétés
  const defaultCompany: CompanyData = {
    _id: "1",
    name: "Velora ERP",
    businessName: "Velora Solutions",
    subdomain: "velora",
    email: "contact@velora.com",
    phone: "+33 1 23 45 67 89",
    address: "123 Avenue des Champs-Élysées",
    city: "Paris",
    country: "France",
    postalCode: "75008",
    taxNumber: "FR12345678901",
    tvaIntra: "FR12345678901",
    logo: null,
    currency: "EUR",
    language: "fr",
    timezone: "Europe/Paris",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ✅ Fusion des données avec valeurs par défaut
  const companyData: CompanyData = {
    ...defaultCompany,
    ...(company || {}),
    // S'assurer que les propriétés optionnelles ont des valeurs par défaut
    currency: company?.currency || defaultCompany.currency,
    language: company?.language || defaultCompany.language,
    timezone: company?.timezone || defaultCompany.timezone,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <Building2 size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • COMPANY_SETTINGS
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● CONFIGURATION
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Paramètres de <span className="text-[var(--accent)]">l'entreprise</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gérez les informations et la configuration de votre organisation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
              <Building2 size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">INFO</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Entreprise</p>
          <p className="text-lg font-black text-[var(--foreground)] truncate">{companyData.name}</p>
          <p className="text-[8px] text-[var(--foreground-muted)]">ID: {companyData._id?.slice(-8)}</p>
        </div>

        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Globe size={16} className="text-emerald-500" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">DOMAIN</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Sous-domaine</p>
          <p className="text-lg font-black text-emerald-500">{companyData.subdomain}.velora.com</p>
          <p className="text-[8px] text-[var(--foreground-muted)]">Accès public</p>
        </div>

        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <CreditCard size={16} className="text-purple-500" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">BILLING</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Devise</p>
          <p className="text-lg font-black text-purple-500">{companyData.currency || 'EUR'}</p>
          <p className="text-[8px] text-[var(--foreground-muted)]">Locale</p>
        </div>

        <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
              <Activity size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--accent)]">SYSTEM</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Version</p>
          <p className="text-lg font-black text-[var(--accent)]">v2.0.0</p>
          <p className="text-[8px] text-[var(--foreground-muted)]">Dernière mise à jour</p>
        </div>
      </div>

      {/* CLIENT COMPONENT FOR FORM */}
      <CompanyClient initialCompany={companyData} token={token} />
    </div>
  );
}