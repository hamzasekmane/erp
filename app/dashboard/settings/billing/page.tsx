import { cookies } from "next/headers";
import { Metadata } from "next";
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { settingsService } from "@/app/services/settingsService";
import { BillingClient } from "./BillingClient";

export const metadata: Metadata = {
  title: "Velora ERP | Facturation & Abonnement",
  description: "Gérez votre abonnement et vos factures",
};

interface SubscriptionData {
  plan: {
    name: string;
    code: string;
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    features: string[];
  };
  status: 'active' | 'inactive' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  paymentMethod?: {
    type: string;
    last4?: string;
    expiryDate?: string;
  };
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  pdfUrl?: string;
}

export default async function BillingSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // Récupérer les informations de facturation
  let billingData: SubscriptionData | null = null;
  let billingError = null;

  try {
    const billingRes = await settingsService.getBilling(token);
    if (billingRes?.success && billingRes.data) {
      billingData = billingRes.data;
    } else {
      billingError = billingRes?.error || "Impossible de charger les informations de facturation";
    }
  } catch (error) {
    billingError = error instanceof Error ? error.message : "Erreur inconnue";
  }

  // Données par défaut pour la démo
  const defaultSubscription: SubscriptionData = {
    plan: {
      name: "Professionnel",
      code: "professional",
      price: 99,
      currency: "EUR",
      billingCycle: "monthly",
      features: [
        "Jusqu'à 50 utilisateurs",
        "Stockage 100GB",
        "Support prioritaire",
        "API Access",
        "Rapports avancés",
        "Personnalisation avancée"
      ]
    },
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: {
      type: "Visa",
      last4: "4242",
      expiryDate: "12/2026"
    },
    invoices: [
      {
        id: "inv_1",
        number: "INV-2024-001",
        date: new Date().toISOString(),
        amount: 99,
        status: "paid",
      },
      {
        id: "inv_2",
        number: "INV-2024-002",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 99,
        status: "paid",
      }
    ]
  };

  const subscription = billingData || defaultSubscription;

  // Calculer les jours restants
  const daysRemaining = Math.ceil(
    (new Date(subscription.endDate).getTime() - new Date().getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  // Statut badge component
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "emerald", icon: CheckCircle, text: "Actif" },
      inactive: { color: "gray", icon: AlertCircle, text: "Inactif" },
      expired: { color: "red", icon: AlertCircle, text: "Expiré" },
      trial: { color: "blue", icon: Clock, text: "Période d'essai" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${config.color}-500/10 text-${config.color}-500 border border-${config.color}-500/30`}>
        <Icon size={12} />
        {config.text}
      </span>
    );
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
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl">
              <CreditCard size={20} className="text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">
                  VELORA • BILLING
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
                  ● SUBSCRIPTION
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Facturation & <span className="text-purple-500">Abonnement</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gérez votre abonnement et consultez vos factures
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {billingError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-500">Information</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {billingError}. Affichage des données de démonstration.
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Subscription Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-[var(--foreground)]">Plan actuel</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Votre abonnement en cours</p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>

            <div className="mb-6">
              <h3 className="text-3xl font-black text-purple-500">{subscription.plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black">{subscription.plan.price} {subscription.plan.currency}</span>
                <span className="text-sm text-[var(--foreground-muted)]">/ {subscription.plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Date de début</p>
                <p className="text-sm font-medium">
                  {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Prochaine facturation</p>
                <p className="text-sm font-medium">
                  {new Date(subscription.nextBillingDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Jours restants</p>
                <p className={`text-sm font-medium ${daysRemaining < 7 ? 'text-amber-500' : ''}`}>
                  {daysRemaining} jours
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Renouvellement</p>
                <p className="text-sm font-medium">Automatique</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all font-medium text-sm">
                Changer de plan
              </button>
              <button className="px-4 py-2 border border-[var(--border)] hover:border-purple-500/50 rounded-xl transition-all font-medium text-sm">
                Gérer le paiement
              </button>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Zap size={18} className="text-purple-500" />
              Fonctionnalités incluses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subscription.plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Payment Method */}
        <div className="space-y-6">
          {/* Payment Method Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-purple-500" />
              Moyen de paiement
            </h3>
            
            {subscription.paymentMethod ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[var(--accent)]/5 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                    <div>
                      <p className="text-sm font-medium">{subscription.paymentMethod.type} •••• {subscription.paymentMethod.last4}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">Expire le {subscription.paymentMethod.expiryDate}</p>
                    </div>
                  </div>
                  <button className="text-xs text-purple-500 hover:text-purple-400">
                    Modifier
                  </button>
                </div>
                <button className="w-full px-4 py-2 border border-[var(--border)] hover:border-purple-500/50 rounded-xl transition-all text-sm">
                  Ajouter un moyen de paiement
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <CreditCard size={40} className="mx-auto text-[var(--foreground-muted)] mb-3" />
                <p className="text-sm text-[var(--foreground-muted)]">Aucun moyen de paiement enregistré</p>
                <button className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm">
                  Ajouter une carte
                </button>
              </div>
            )}
          </div>

          {/* Usage Stats Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-black mb-4">Utilisation</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Utilisateurs</span>
                  <span>24 / 50</span>
                </div>
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '48%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Stockage</span>
                  <span>45 GB / 100 GB</span>
                </div>
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INVOICES SECTION */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h3 className="text-lg font-black flex items-center gap-2">
            <FileText size={18} className="text-purple-500" />
            Historique des factures
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <tr>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">N° Facture</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Montant</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Statut</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscription.invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors">
                  <td className="p-4 text-sm font-mono">{invoice.number}</td>
                  <td className="p-4 text-sm">{new Date(invoice.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-4 text-sm font-medium">{invoice.amount} {subscription.plan.currency}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                      invoice.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {invoice.status === 'paid' ? 'Payée' : invoice.status === 'pending' ? 'En attente' : 'En retard'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="p-1 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                      <Download size={16} className="text-[var(--foreground-muted)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLIENT COMPONENT FOR INTERACTIVE ACTIONS */}
      <BillingClient subscription={subscription} token={token} />
    </div>
  );
}