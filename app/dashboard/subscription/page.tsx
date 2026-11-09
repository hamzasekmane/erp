import { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Crown,
  Users,
  Database,
  Headphones,
  Rocket,
  Clock,
  Download,
  ArrowLeft,
  Building2,
  Receipt,
  Gift,
} from "lucide-react";
import { getSubscriptionData } from "../../actions/subscription";
import { bytesToGB } from "../../services/subscriptionService";
import PlanCard from "@/app/components/subscription/PlanCard";

export const metadata: Metadata = {
  title: "Velora ERP | Abonnement",
  description: "Gérez votre abonnement et vos factures",
};

const formatAmount = (amount: number, currency = "EUR") => {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
};

export default async function SubscriptionPage() {
  const { subscription, plans, invoices, paymentMethod, billingInfo, currentUsage  } = await getSubscriptionData();

  if (!subscription) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-bold mb-2">Impossible de charger votre abonnement</h2>
        <p className="text-[var(--foreground-muted)]">Veuillez réessayer plus tard ou contacter le support.</p>
      </div>
    );
  }

const { currentUsers, usedStorageGB, currentMonthInvoices } = currentUsage;

  const totalStorageGB = bytesToGB(subscription.limits.storage);
  const usersPercent = Math.min(100, (currentUsers / subscription.limits.users) * 100);
  const storagePercent = Math.min(100, (usedStorageGB / totalStorageGB) * 100);
  const invoicesPercent = Math.min(100, (currentMonthInvoices / subscription.limits.invoices) * 100);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/dashboard" className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group">
          <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
        </Link>
        <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
          <CreditCard size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              VELORA • SUBSCRIPTION
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              ● {subscription.status === "active" ? "ACTIF" : subscription.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Abonnement & <span className="text-[var(--accent)]">Facturation</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Gérez votre abonnement et consultez vos factures
          </p>
        </div>
      </div>

      {/* Carte de l'abonnement actuel */}
      <div className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-2xl flex items-center justify-center">
                <Crown size={32} className="text-[var(--accent)]" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle size={10} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Plan actuel</p>
              <p className="text-2xl font-black text-[var(--accent)]">{subscription.planName}</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                depuis le {new Date(subscription.startDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-amber-500" />
              <span className="text-xs text-[var(--foreground-muted)]">
                {subscription.isExpired
                  ? "Abonnement expiré"
                  : `Prochain renouvellement dans ${subscription.daysRemaining} jours`}
              </span>
            </div>
            <div className="flex gap-2">
              <a href="#plans" className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">
                Mettre à jour
              </a>
              <form action="/api/subscriptions/cancel" method="POST">
                <button type="submit" className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--accent)]/10 transition-colors">
                  Annuler l'abonnement
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Statistiques d'utilisation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
          <div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Utilisateurs</p>
            <p className="text-xl font-black">{currentUsers} / {subscription.limits.users}</p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${usersPercent}%` }} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Stockage utilisé</p>
            <p className="text-xl font-black">{usedStorageGB.toFixed(1)} / {totalStorageGB.toFixed(1)} GB</p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${storagePercent}%` }} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Factures (mois)</p>
            <p className="text-xl font-black">{currentMonthInvoices} / {subscription.limits.invoices}</p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${invoicesPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plans disponibles */}
      <div id="plans">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[var(--accent)]/10 rounded-lg"><Rocket size={16} className="text-[var(--accent)]" /></div>
          <h2 className="text-lg font-black">Nos offres</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans
            .filter((plan) => plan.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((plan) => (
              <PlanCard key={plan.id} plan={plan} currentSubscription={subscription} />
            ))}
        </div>
      </div>

      {/* Modules supplémentaires (add-ons) - à connecter si nécessaire */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg"><Gift size={16} className="text-purple-500" /></div>
          <h2 className="text-lg font-black">Modules supplémentaires</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-[var(--border)] rounded-xl hover:border-[var(--accent)]/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Users size={16} className="text-blue-500" /></div>
              <span className="text-sm font-black">+29€/mois</span>
            </div>
            <p className="text-sm font-black mb-1">Utilisateurs supplémentaires</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Pack de 10 utilisateurs additionnels</p>
            <button className="w-full mt-3 py-1.5 text-xs bg-[var(--accent)]/10 rounded-lg hover:bg-[var(--accent)]/20 transition-colors">Ajouter</button>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-xl hover:border-[var(--accent)]/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Database size={16} className="text-emerald-500" /></div>
              <span className="text-sm font-black">+49€/mois</span>
            </div>
            <p className="text-sm font-black mb-1">Stockage supplémentaire</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">+100 Go d'espace de stockage</p>
            <button className="w-full mt-3 py-1.5 text-xs bg-[var(--accent)]/10 rounded-lg hover:bg-[var(--accent)]/20 transition-colors">Ajouter</button>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-xl hover:border-[var(--accent)]/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Headphones size={16} className="text-amber-500" /></div>
              <span className="text-sm font-black">+99€/mois</span>
            </div>
            <p className="text-sm font-black mb-1">Support Premium</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Support dédié 24/7 avec SLA</p>
            <button className="w-full mt-3 py-1.5 text-xs bg-[var(--accent)]/10 rounded-lg hover:bg-[var(--accent)]/20 transition-colors">Ajouter</button>
          </div>
        </div>
      </div>

      {/* Factures récentes */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg"><Receipt size={16} className="text-[var(--accent)]" /></div>
              <h2 className="text-lg font-black">Factures récentes</h2>
            </div>
            <Link href="/dashboard/subscription/invoices" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
              Voir toutes <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-[var(--foreground-muted)] text-sm">Aucune facture trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="p-4 text-left text-[10px] font-black uppercase">N° Facture</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Date</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Plan</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Montant</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Statut</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[var(--background)]/50 transition-colors">
                    <td className="p-4 text-sm font-medium">{invoice.id}</td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">{new Date(invoice.date).toLocaleDateString("fr-FR")}</td>
                    <td className="p-4 text-sm">{invoice.planName}</td>
                    <td className="p-4 text-sm font-medium">{formatAmount(invoice.amount, invoice.currency)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${
                        invoice.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : invoice.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        <CheckCircle size={10} />
                        {invoice.status === "paid" ? "Payée" : invoice.status === "pending" ? "En attente" : "Échouée"}
                      </span>
                    </td>
                    <td className="p-4">
                      <a href={invoice.downloadUrl} download className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors inline-block">
                        <Download size={14} className="text-[var(--foreground-muted)]" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Moyen de paiement */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg"><CreditCard size={16} className="text-blue-500" /></div>
          <h2 className="text-lg font-black">Moyen de paiement</h2>
        </div>
        {paymentMethod ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-[8px] font-black uppercase">{paymentMethod.brand}</div>
              <div>
                <p className="text-sm font-medium">•••• •••• •••• {paymentMethod.last4}</p>
                <p className="text-[10px] text-[var(--foreground-muted)]">Expire le {paymentMethod.expMonth}/{paymentMethod.expYear}</p>
              </div>
            </div>
            <button className="text-xs text-[var(--accent)] hover:underline">Mettre à jour</button>
          </div>
        ) : (
          <p className="text-sm text-[var(--foreground-muted)]">Aucun moyen de paiement enregistré.</p>
        )}
      </div>

      {/* Informations de facturation */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg"><Building2 size={16} className="text-purple-500" /></div>
          <h2 className="text-lg font-black">Informations de facturation</h2>
        </div>
        {billingInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Société</p><p className="text-sm font-medium">{billingInfo.companyName}</p></div>
            <div><p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">N° TVA</p><p className="text-sm font-medium">{billingInfo.vatNumber}</p></div>
            <div><p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Adresse</p><p className="text-sm">{billingInfo.address}</p></div>
            <div><p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Email facturation</p><p className="text-sm">{billingInfo.billingEmail}</p></div>
          </div>
        ) : (
          <p className="text-sm text-[var(--foreground-muted)]">Informations de facturation non renseignées.</p>
        )}
        <button className="mt-4 text-xs text-[var(--accent)] hover:underline">Modifier les informations</button>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
        <p className="text-[8px] font-mono text-[var(--foreground-muted)]">Velora ERP • Subscription Management • v2.0.0</p>
        <div className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[7px] font-mono text-[var(--foreground-muted)]">Paiement sécurisé • Stripe</span></div>
      </div>
    </div>
  );
}