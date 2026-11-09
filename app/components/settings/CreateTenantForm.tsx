"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Save, 
  X, 
  Shield, 
  Globe, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  CreditCard, 
  Database, 
  Server,
  CheckCircle,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  Users,
  DollarSign,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { settingsService } from "@/app/services/settingsService";

interface CreateTenantFormProps {
  token: string;
}

interface FormData {
  name: string;
  subdomain: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  plan: string;
  status: string;
  databaseName: string;
  maxUsers: number;
  storageLimit: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  settings: {
    theme: string;
    language: string;
    timezone: string;
    currency: string;
  };
}

export function CreateTenantForm({ token }: CreateTenantFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    subdomain: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "France",
    plan: "standard",
    status: "active",
    databaseName: "",
    maxUsers: 10,
    storageLimit: 5,
    subscriptionStart: new Date().toISOString().split('T')[0],
    subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    settings: {
      theme: "light",
      language: "fr",
      timezone: "Europe/Paris",
      currency: "EUR"
    }
  });

  const plans = [
    { value: "starter", label: "Starter", price: "29€/mois", users: 5, storage: 1 },
    { value: "standard", label: "Standard", price: "79€/mois", users: 20, storage: 5 },
    { value: "professional", label: "Professional", price: "199€/mois", users: 50, storage: 20 },
    { value: "enterprise", label: "Enterprise", price: "499€/mois", users: "Illimité", storage: 100 }
  ];

  // Correction: Typage explicite pour handleChange
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.') as [keyof FormData, string];
      const parentValue = formData[parent];
      
      // Vérifier que parentValue est un objet avant de faire spread
      if (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent] as Record<string, any>),
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'maxUsers' || name === 'storageLimit' ? parseInt(value) || 0 : value 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await settingsService.createTenant(token, formData);
      
      if (response.success) {
        toast.success(
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="font-bold">Tenant créé avec succès</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {formData.name} a été ajouté à la plateforme
              </p>
            </div>
          </div>,
          { duration: 4000 }
        );
        
        router.push('/dashboard/settings/tenants');
        router.refresh();
      } else {
        throw new Error(response.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error(
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-500" />
          <div>
            <p className="font-bold">Erreur</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Impossible de créer le tenant
            </p>
          </div>
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Card */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <Building2 size={16} className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                Informations générales
              </h2>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                Identité et coordonnées de l'organisation
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Building2 size={12} /> Nom de l'organisation *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Velora Solutions"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Globe size={12} /> Sous-domaine *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  required
                  placeholder="velora"
                  className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                <span className="text-sm text-[var(--foreground-muted)]">.velora.com</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Mail size={12} /> Email administratif *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="admin@entreprise.com"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Phone size={12} /> Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 1 23 45 67 89"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
              <MapPin size={12} /> Adresse
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              placeholder="Adresse complète"
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Ville</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Paris"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Pays</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Canada">Canada</option>
                <option value="Luxembourg">Luxembourg</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Plan Card */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <CreditCard size={16} className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                Abonnement & Configuration
              </h2>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                Plan, ressources et limites
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={12} /> Plan d'abonnement *
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                {plans.map(plan => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label} - {plan.price} ({typeof plan.users === 'number' ? plan.users : plan.users} utilisateurs, {plan.storage}GB)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Shield size={12} /> Statut initial
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="trial">Essai</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Users size={12} /> Nombre max d'utilisateurs
              </label>
              <input
                type="number"
                name="maxUsers"
                value={formData.maxUsers}
                onChange={handleChange}
                min={1}
                max={1000}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <HardDrive size={12} /> Limite de stockage (GB)
              </label>
              <input
                type="number"
                name="storageLimit"
                value={formData.storageLimit}
                onChange={handleChange}
                min={1}
                max={1000}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Calendar size={12} /> Date de début
              </label>
              <input
                type="date"
                name="subscriptionStart"
                value={formData.subscriptionStart}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Clock size={12} /> Date de fin
              </label>
              <input
                type="date"
                name="subscriptionEnd"
                value={formData.subscriptionEnd}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Database Configuration Card */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <Database size={16} className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                Configuration technique
              </h2>
              <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                Base de données et paramètres système
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Server size={12} /> Nom de la base de données
              </label>
              <input
                type="text"
                name="databaseName"
                value={formData.databaseName}
                onChange={handleChange}
                placeholder={`db_${formData.subdomain || 'tenant'}`}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Globe size={12} /> Langue par défaut
              </label>
              <select
                name="settings.language"
                value={formData.settings.language}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={12} /> Devise
              </label>
              <select
                name="settings.currency"
                value={formData.settings.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
                <option value="GBP">Livre (£)</option>
                <option value="CHF">Franc suisse (CHF)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                <Clock size={12} /> Fuseau horaire
              </label>
              <select
                name="settings.timezone"
                value={formData.settings.timezone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/dashboard/settings/tenants"
          className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] transition-all"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Save size={14} />
              Créer le tenant
            </>
          )}
        </button>
      </div>
    </form>
  );
}