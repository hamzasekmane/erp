// app/dashboard/settings/company/CompanyClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Languages,
  Clock,
  DollarSign,
  Upload,
  Image,
  Trash2,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { settingsService } from "@/app/services/settingsService";

// ✅ Interface complète pour CompanyData
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
  dateFormat?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CompanyClientProps {
  initialCompany: CompanyData;
  token: string;
}

export function CompanyClient({ initialCompany, token }: CompanyClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [company, setCompany] = useState<CompanyData>(initialCompany);

  const tabs = [
    { id: "general", label: "Général", icon: Building2 },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "localization", label: "Localisation", icon: Globe },
    { id: "billing", label: "Facturation", icon: CreditCard },
  ];

  const handleChange = (field: keyof CompanyData, value: any) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ Préparer les données à envoyer (sans les champs système)
      const updateData = {
        name: company.name,
        businessName: company.businessName,
        subdomain: company.subdomain,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        country: company.country,
        postalCode: company.postalCode,
        taxNumber: company.taxNumber,
        tvaIntra: company.tvaIntra,
        currency: company.currency,
        language: company.language,
        timezone: company.timezone,
      };

      const response = await settingsService.updateCurrentTenant(token, updateData);
      
      if (response.success) {
        toast.success(
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="font-bold">Entreprise mise à jour</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Les informations ont été enregistrées avec succès
              </p>
            </div>
          </div>,
          { duration: 3000 }
        );
        router.refresh();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error(
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-500" />
          <div>
            <p className="font-bold">Erreur</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Impossible de mettre à jour les informations
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
      {/* TABS */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[var(--border)] px-4 gap-1 custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
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

        <div className="p-6">
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={12} /> Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={company.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={12} /> Nom commercial
                  </label>
                  <input
                    type="text"
                    value={company.businessName || ""}
                    onChange={(e) => handleChange("businessName", e.target.value)}
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
                      value={company.subdomain || ""}
                      onChange={(e) => handleChange("subdomain", e.target.value)}
                      required
                      className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                    />
                    <span className="text-sm text-[var(--foreground-muted)]">.velora.com</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={12} /> Numéro fiscal
                  </label>
                  <input
                    type="text"
                    value={company.taxNumber || ""}
                    onChange={(e) => handleChange("taxNumber", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={12} /> TVA Intracommunautaire
                  </label>
                  <input
                    type="text"
                    value={company.tvaIntra || ""}
                    onChange={(e) => handleChange("tvaIntra", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Image size={12} /> Logo de l'entreprise
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl flex items-center justify-center border-2 border-[var(--border)]">
                      {company.logo ? (
                        <img src={company.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Building2 size={24} className="text-[var(--foreground-muted)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        className="px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg text-[10px] font-black uppercase text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
                      >
                        <Upload size={12} className="inline mr-2" />
                        Télécharger un logo
                      </button>
                      <p className="text-[8px] text-[var(--foreground-muted)] mt-1">
                        Format: PNG, JPG, SVG. Max: 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Mail size={12} /> Email
                  </label>
                  <input
                    type="email"
                    value={company.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Phone size={12} /> Téléphone
                  </label>
                  <input
                    type="tel"
                    value={company.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={12} /> Adresse
                  </label>
                  <textarea
                    value={company.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Ville</label>
                  <input
                    type="text"
                    value={company.city || ""}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Code postal</label>
                  <input
                    type="text"
                    value={company.postalCode || ""}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Pays</label>
                  <select
                    value={company.country || "France"}
                    onChange={(e) => handleChange("country", e.target.value)}
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
          )}

          {/* LOCALIZATION TAB */}
          {activeTab === "localization" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Languages size={12} /> Langue par défaut
                  </label>
                  <select
                    value={company.language || "fr"}
                    onChange={(e) => handleChange("language", e.target.value)}
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
                    value={company.currency || "EUR"}
                    onChange={(e) => handleChange("currency", e.target.value)}
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
                    value={company.timezone || "Europe/Paris"}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  >
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Format de date</label>
                  <select
                    value={company.dateFormat || "DD/MM/YYYY"}
                    onChange={(e) => handleChange("dateFormat", e.target.value as any)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={12} /> Numéro fiscal
                  </label>
                  <input
                    type="text"
                    value={company.taxNumber || ""}
                    onChange={(e) => handleChange("taxNumber", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={12} /> TVA Intracommunautaire
                  </label>
                  <input
                    type="text"
                    value={company.tvaIntra || ""}
                    onChange={(e) => handleChange("tvaIntra", e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={12} /> Mode de paiement par défaut
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  >
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="credit_card">Carte de crédit</option>
                    <option value="paypal">PayPal</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={12} /> Délai de paiement (jours)
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-[var(--background)]/50 border border-[var(--border)] rounded-xl">
                <div className="flex items-start gap-3">
                  <CreditCard size={14} className="text-[var(--foreground-muted)] mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-[var(--foreground)]">Informations de facturation</p>
                    <p className="text-[9px] text-[var(--foreground-muted)] mt-1">
                      Ces informations seront utilisées sur toutes les factures émises par votre entreprise.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}