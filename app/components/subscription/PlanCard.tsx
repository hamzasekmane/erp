// app/components/subscription/PlanCard.tsx
'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  CheckCircle,
  AlertCircle,
  Users,
  Database,
  FileText,
  Building2,
  Package,
  BarChart3,
  Code,
  Palette,
  Zap,
  Crown,
} from 'lucide-react';
import { Plan, Subscription } from '../../services/subscriptionService';
import { changePlanAction } from '@/app/actions/subscription';

interface PlanCardProps {
  plan: Plan;
  currentSubscription: Subscription;
}

// Styles visuels pour chaque plan (basés sur le code unique)
const getPlanStyles = (planCode: string) => {
  const styles: Record<string, { color: string; borderColor: string; textColor: string; buttonColor: string }> = {
    starter: {
      color: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-500',
      buttonColor: 'bg-blue-500',
    },
    professional: {
      color: 'from-[var(--accent)]/20 to-[var(--accent)]/5',
      borderColor: 'border-[var(--accent)]/50',
      textColor: 'text-[var(--accent)]',
      buttonColor: 'bg-[var(--accent)]',
    },
    enterprise: {
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-500',
      buttonColor: 'bg-purple-500',
    },
  };
  return styles[planCode] || styles.professional;
};

const formatAmount = (amount: number, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
};

// Composant interne pour le bouton de soumission (avec état de chargement)
function SubmitButton({ isCurrentPlan, children }: { isCurrentPlan: boolean; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={isCurrentPlan || pending}
      className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
        isCurrentPlan
          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
          : 'bg-[var(--accent)] text-white hover:opacity-90'
      } ${pending ? 'opacity-70 cursor-wait' : ''}`}
    >
      {pending ? 'Chargement...' : children}
    </button>
  );
}

export default function PlanCard({ plan, currentSubscription }: PlanCardProps) {
  const styles = getPlanStyles(plan.code);
  const isCurrentPlan = currentSubscription.planId === plan.id;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(currentSubscription.billingCycle);
  const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
  const periodLabel = billingCycle === 'monthly' ? 'mois' : 'an';

  return (
    <div
      className={`relative bg-[var(--card-bg)] border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 ${
        plan.isPopular
          ? `border-[var(--accent)] shadow-xl shadow-[var(--accent)]/20`
          : `border-[var(--border)] hover:border-[var(--accent)]/50`
      }`}
    >
      {plan.isPopular && (
        <div className="absolute top-0 right-0">
          <div className="bg-[var(--accent)] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">
            POPULAIRE
          </div>
        </div>
      )}

      <div className={`p-6 bg-gradient-to-br ${styles.color}`}>
        <h3 className="text-xl font-black mb-1">{plan.name}</h3>
        <p className="text-xs text-[var(--foreground-muted)] mb-3">{plan.description}</p>
        <div className="mb-4">
          <span className="text-3xl font-black">{formatAmount(price, plan.currency)}</span>
          <span className="text-xs text-[var(--foreground-muted)]"> / {periodLabel}</span>
        </div>

        <form action={changePlanAction}>
          <input type="hidden" name="planId" value={plan.id} />
          <select
            name="billingCycle"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
            className="mb-2 text-xs bg-transparent border border-[var(--border)] rounded p-1 w-full"
          >
            <option value="monthly">Mensuel</option>
            <option value="yearly">Annuel (économisez 20%)</option>
          </select>
          <SubmitButton isCurrentPlan={isCurrentPlan}>
            {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
          </SubmitButton>
        </form>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <p className="text-xs font-black mb-2">✓ Fonctionnalités incluses</p>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Users size={12} className="text-emerald-500" /> {plan.features.users} utilisateurs
            </li>
            <li className="flex items-center gap-2">
              <Database size={12} className="text-emerald-500" /> {plan.features.storage} Mo de stockage
            </li>
            <li className="flex items-center gap-2">
              <FileText size={12} className="text-emerald-500" /> {plan.features.invoices.monthly} factures / mois
            </li>
            <li className="flex items-center gap-2">
              <Building2 size={12} className="text-emerald-500" /> {plan.features.clients} clients
            </li>
            <li className="flex items-center gap-2">
              <Package size={12} className="text-emerald-500" /> {plan.features.products} produits
            </li>
            {plan.features.hasReports && (
              <li className="flex items-center gap-2">
                <BarChart3 size={12} className="text-emerald-500" /> Rapports avancés
              </li>
            )}
            {plan.features.hasApiAccess && (
              <li className="flex items-center gap-2">
                <Code size={12} className="text-emerald-500" /> Accès API complet
              </li>
            )}
            {plan.features.hasCustomBranding && (
              <li className="flex items-center gap-2">
                <Palette size={12} className="text-emerald-500" /> Personnalisation avancée
              </li>
            )}
          </ul>
        </div>
        {plan.trialDays > 0 && (
          <div className="text-amber-500 text-[10px] flex items-center gap-1">
            <Zap size={10} /> {plan.trialDays} jours d'essai gratuit
          </div>
        )}
      </div>
    </div>
  );
}