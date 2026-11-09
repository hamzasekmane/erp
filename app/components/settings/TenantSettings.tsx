"use client";

import { useState } from "react";
import { 
  Settings, 
  Globe, 
  Database, 
  Shield, 
  Bell, 
  Mail, 
  Lock, 
  Key,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe2,
  Clock,
  DollarSign,
  Languages,
  Palette,
  HardDrive,
  Server,
  Cloud,
  Wifi,
  Activity,
  BarChart3,
  FileText,
  Users,
  CreditCard,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { settingsService } from "@/app/services/settingsService";

interface TenantSettingsProps {
  tenant: any;
  token: string;
}

export function TenantSettings({ tenant, token }: TenantSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      name: tenant.name || "",
      subdomain: tenant.subdomain || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      website: tenant.website || "",
      address: tenant.address || "",
      city: tenant.city || "",
      country: tenant.country || "France"
    },
    localization: {
      language: tenant.settings?.language || "fr",
      timezone: tenant.settings?.timezone || "Europe/Paris",
      currency: tenant.settings?.currency || "EUR",
      dateFormat: tenant.settings?.dateFormat || "DD/MM/YYYY",
      numberFormat: tenant.settings?.numberFormat || "fr-FR"
    },
    appearance: {
      theme: tenant.settings?.theme || "light",
      primaryColor: tenant.settings?.primaryColor || "#06b6d4",
      logo: tenant.settings?.logo || null,
      favicon: tenant.settings?.favicon || null
    },
    security: {
      twoFactorAuth: tenant.security?.twoFactorAuth || false,
      sessionTimeout: tenant.security?.sessionTimeout || 60,
      passwordPolicy: tenant.security?.passwordPolicy || "medium",
      ipWhitelist: tenant.security?.ipWhitelist || [],
      allowedDomains: tenant.security?.allowedDomains || []
    },
    notifications: {
      emailNotifications: tenant.notifications?.emailNotifications || true,
      pushNotifications: tenant.notifications?.pushNotifications || true,
      slackWebhook: tenant.notifications?.slackWebhook || "",
      alertOnLogin: tenant.notifications?.alertOnLogin || false,
      weeklyReports: tenant.notifications?.weeklyReports || true
    },
    integrations: {
      stripe: tenant.integrations?.stripe || false,
      slack: tenant.integrations?.slack || false,
      googleDrive: tenant.integrations?.googleDrive || false,
      dropbox: tenant.integrations?.dropbox || false,
      zapier: tenant.integrations?.zapier || false
    }
  });

  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Général", icon: Settings },
    { id: "localization", label: "Localisation", icon: Globe2 },
    { id: "appearance", label: "Apparence", icon: Palette },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Intégrations", icon: Zap }
  ];

  const handleChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await settingsService.updateTenantSettings(token, tenant._id, settings);
      if (response.success) {
        toast.success(
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="font-bold">Paramètres mis à jour</p>
              <p className="text-xs text-[var(--foreground-muted)]">Les modifications ont été enregistrées</p>
            </div>
          </div>
        );
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
            <Settings size={16} className="text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
              Paramètres du tenant
            </h2>
            <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
              Configuration avancée de l'organisation
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-[var(--border)] px-4 gap-1 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Nom de l'organisation</label>
                <input
                  type="text"
                  value={settings.general.name}
                  onChange={(e) => handleChange("general", "name", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Sous-domaine</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.general.subdomain}
                    onChange={(e) => handleChange("general", "subdomain", e.target.value)}
                    className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  <span className="text-sm text-[var(--foreground-muted)]">.velora.com</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={settings.general.email}
                  onChange={(e) => handleChange("general", "email", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Téléphone</label>
                <input
                  type="tel"
                  value={settings.general.phone}
                  onChange={(e) => handleChange("general", "phone", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Site web</label>
                <input
                  type="url"
                  value={settings.general.website}
                  onChange={(e) => handleChange("general", "website", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Adresse</label>
                <textarea
                  value={settings.general.address}
                  onChange={(e) => handleChange("general", "address", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Localization Settings */}
        {activeTab === "localization" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Languages size={12} /> Langue
                </label>
                <select
                  value={settings.localization.language}
                  onChange={(e) => handleChange("localization", "language", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Clock size={12} /> Fuseau horaire
                </label>
                <select
                  value={settings.localization.timezone}
                  onChange={(e) => handleChange("localization", "timezone", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={12} /> Devise
                </label>
                <select
                  value={settings.localization.currency}
                  onChange={(e) => handleChange("localization", "currency", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar ($)</option>
                  <option value="GBP">Livre (£)</option>
                  <option value="CHF">Franc suisse (CHF)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Format de date</label>
                <select
                  value={settings.localization.dateFormat}
                  onChange={(e) => handleChange("localization", "dateFormat", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-between p-4 bg-[var(--background)]/50 rounded-xl">
                <div>
                  <p className="text-sm font-black text-[var(--foreground)]">Authentification à deux facteurs</p>
                  <p className="text-[9px] text-[var(--foreground-muted)]">Sécurisez l'accès avec 2FA</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("security", "twoFactorAuth", !settings.security.twoFactorAuth)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.security.twoFactorAuth ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.security.twoFactorAuth ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Délai d'inactivité (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleChange("security", "sessionTimeout", parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Politique de mot de passe</label>
                <select
                  value={settings.security.passwordPolicy}
                  onChange={(e) => handleChange("security", "passwordPolicy", e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save size={14} />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}