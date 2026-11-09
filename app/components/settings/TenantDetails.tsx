// app/components/settings/TenantDetails.tsx
"use client";

import { Building2, Mail, Phone, MapPin, Globe, Calendar, CreditCard, Server, Key, Briefcase, FileText, Users, HardDrive, Lock, DollarSign, Languages, Package } from "lucide-react";

interface TenantDetailsProps {
  tenant: any;
}

export function TenantDetails({ tenant }: TenantDetailsProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non renseignée';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const infoSections = [
    {
      title: "Informations générales",
      icon: Building2,
      fields: [
        { label: "Nom", value: tenant.name, icon: Building2 },
        { label: "Nom commercial", value: tenant.businessName || tenant.name, icon: Briefcase },
        { label: "Email", value: tenant.email, icon: Mail },
        { label: "Téléphone", value: tenant.phone || "Non renseigné", icon: Phone },
        { label: "Adresse", value: tenant.address || "Non renseignée", icon: MapPin },
        { label: "Ville", value: tenant.city || "Non renseignée", icon: MapPin },
        { label: "Pays", value: tenant.country || "Non renseigné", icon: Globe },
        { label: "Code postal", value: tenant.postalCode || "Non renseigné", icon: MapPin },
        { label: "Numéro fiscal", value: tenant.taxNumber || "Non renseigné", icon: FileText },
        { label: "TVA Intracommunautaire", value: tenant.tvaIntra || "Non renseigné", icon: FileText },
        { label: "Créé le", value: formatDate(tenant.createdAt), icon: Calendar }
      ]
    },
    {
      title: "Abonnement & Plan",
      icon: CreditCard,
      fields: [
        { label: "Plan", value: tenant.plan?.toUpperCase() || "STANDARD", icon: CreditCard },
        { label: "Code plan", value: tenant.planCode?.toUpperCase() || "standard", icon: Key },
        { label: "Statut abonnement", value: tenant.subscription?.status === 'active' ? 'ACTIF' : tenant.subscription?.status === 'expired' ? 'EXPIRÉ' : 'INACTIF', icon: CreditCard },
        { label: "Date d'expiration", value: formatDate(tenant.subscriptionEnd), icon: Calendar },
        { label: "Devise", value: tenant.currency || "EUR", icon: DollarSign },
        { label: "Langue", value: tenant.language === 'fr' ? 'Français' : tenant.language === 'en' ? 'Anglais' : tenant.language, icon: Languages }
      ]
    },
    {
      title: "Limites & Fonctionnalités",
      icon: Server,
      fields: [
        { label: "Max utilisateurs", value: tenant.features?.users || "Illimité", icon: Users },
        { label: "Stockage max", value: tenant.features?.storage ? `${tenant.features.storage} MB` : "Illimité", icon: HardDrive },
        { label: "Factures/mois", value: tenant.features?.invoices?.monthly || "Illimité", icon: FileText },
        { label: "Max clients", value: tenant.features?.clients || "Illimité", icon: Users },
        { label: "Max produits", value: tenant.features?.products || "Illimité", icon: Package },
        { label: "API Access", value: tenant.features?.hasApiAccess ? "✅ Oui" : "❌ Non", icon: Key },
        { label: "Branding personnalisé", value: tenant.features?.hasCustomBranding ? "✅ Oui" : "❌ Non", icon: Lock },
        { label: "Rapports avancés", value: tenant.features?.hasReports ? "✅ Oui" : "❌ Non", icon: FileText }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {infoSections.map((section, idx) => (
        <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <section.icon size={16} className="text-[var(--accent)]" />
              </div>
              <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                {section.title}
              </h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {section.fields.map((field, i) => (
              <div key={i} className="flex items-start gap-3">
                <field.icon size={14} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono text-[var(--foreground-muted)]">{field.label}</p>
                  <p className="text-sm font-bold text-[var(--foreground)] break-words">
                    {field.value || 'Non renseigné'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}