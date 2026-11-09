// services/subscriptionService.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ==================== TYPES ====================

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending_payment' | 'trial';
  startDate: string;
  endDate: string;
  billingCycle: 'monthly' | 'yearly';
  autoRenew: boolean;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'manual';
  price: number;
  limits: {
    users: number;
    invoices: number;
    storage: number; // en octets
    clients: number;
    products: number;
  };
  features: {
    hasReports: boolean;
    hasApiAccess: boolean;
    hasCustomBranding: boolean;
  };
  isTrial: boolean;
  trialEndDate?: string;
  nextPaymentDate?: string;
  daysRemaining: number;
  isExpired: boolean;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  features: {
    users: number;
    storage: number;      // en Mo
    invoices: { monthly: number };
    clients: number;
    products: number;
    hasReports: boolean;
    hasApiAccess: boolean;
    hasCustomBranding: boolean;
  };
  trialDays: number;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  downloadUrl: string;
}

export interface PaymentMethod {
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

export interface BillingInfo {
  companyName: string;
  vatNumber: string;
  address: string;
  billingEmail: string;
}

// ==================== HELPERS ====================

export function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024;
}

async function fetchWithAuth<T>(token: string, url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }
  const json = await res.json();
  if (json.success === false) throw new Error(json.message || 'Request failed');
  return json.data !== undefined ? json.data : json;
}

// ==================== API CALLS ====================

export async function fetchCurrentSubscription(token: string): Promise<Subscription> {
  const data = await fetchWithAuth<any>(token, '/subscriptions/current');
  return {
    id: data._id,
    tenantId: data.tenantId,
    planId: data.planId,
    planName: data.planName || 'Unknown',
    status: data.status,
    startDate: data.startDate,
    endDate: data.endDate,
    billingCycle: data.billingCycle,
    autoRenew: data.autoRenew,
    paymentMethod: data.paymentMethod,
    price: data.price,
    limits: {
      users: data.limits.users,
      invoices: data.limits.invoices,
      storage: data.limits.storage,
      clients: data.limits.clients,
      products: data.limits.products,
    },
    features: {
      hasReports: data.features?.hasReports || false,
      hasApiAccess: data.features?.hasApiAccess || false,
      hasCustomBranding: data.features?.hasCustomBranding || false,
    },
    isTrial: data.isTrial || false,
    trialEndDate: data.trialEndDate,
    nextPaymentDate: data.nextPaymentDate,
    daysRemaining: data.daysRemaining || 0,
    isExpired: data.isExpired || false,
  };
}

export async function fetchPlans(token: string): Promise<Plan[]> {
  // Changement : /plans -> /subscriptions/plans
  const plans = await fetchWithAuth<any[]>(token, '/subscriptions/plans');
  return plans.map(p => ({
    id: p._id,
    name: p.name,
    code: p.code,
    description: p.description,
    price: {
      monthly: p.price.monthly,
      yearly: p.price.yearly,
    },
    currency: p.currency || 'EUR',
    features: {
      users: p.features.users,
      storage: p.features.storage,
      invoices: { monthly: p.features.invoices.monthly },
      clients: p.features.clients,
      products: p.features.products,
      hasReports: p.features.hasReports,
      hasApiAccess: p.features.hasApiAccess,
      hasCustomBranding: p.features.hasCustomBranding,
    },
    trialDays: p.trialDays,
    isActive: p.isActive,
    isPopular: p.isPopular,
    sortOrder: p.sortOrder,
  }));
}

export async function fetchInvoices(token: string, limit = 5): Promise<Invoice[]> {
  // Changement : /payments -> /subscriptions/invoices
  const invoicesData = await fetchWithAuth<any[]>(token, `/subscriptions/invoices?limit=${limit}`);
  return invoicesData.map(p => ({
    id: p.invoiceNumber || p._id,
    date: p.createdAt || p.date,
    amount: p.amount,
    currency: p.currency || 'EUR',
    status: p.status === 'paid' || p.status === 'completed' ? 'paid' : 'pending',
    planName: p.planName || 'Subscription',
    downloadUrl: p.invoiceUrl || '#',
  }));
}

export async function fetchPaymentMethod(token: string): Promise<PaymentMethod | null> {
  try {
    // Changement : /payment-methods/default -> /subscriptions/payment-method
    const data = await fetchWithAuth<any>(token, '/subscriptions/payment-method');
    return {
      last4: data.last4,
      brand: data.brand,
      expMonth: data.expMonth,
      expYear: data.expYear,
    };
  } catch {
    return null;
  }
}

// Pas d'endpoint billing-info dans votre backend actuel => retourne null
export async function fetchBillingInfo(token: string): Promise<BillingInfo | null> {
  // Option 1 : retourner null (la page affichera "non renseigné")
  return null;
  // Option 2 : si vous avez une route, décommentez :
  // try {
  //   return await fetchWithAuth<BillingInfo>(token, '/subscriptions/billing-info');
  // } catch { return null; }
}

export async function changePlan(
  token: string,
  newPlanId: string,
  billingCycle?: 'monthly' | 'yearly'
): Promise<Subscription> {
  // Récupérer l'abonnement actuel pour connaître le plan actuel et le cycle
  const currentSub = await fetchCurrentSubscription(token);
  const plans = await fetchPlans(token);
  const currentPlan = plans.find(p => p.id === currentSub.planId);
  const newPlan = plans.find(p => p.id === newPlanId);
  if (!newPlan) throw new Error('Plan not found');

  // Déterminer le prix selon le cycle choisi (ou conserver l'actuel)
  const cycle = billingCycle || currentSub.billingCycle;
  const currentPrice = currentPlan ? (cycle === 'monthly' ? currentPlan.price.monthly : currentPlan.price.yearly) : 0;
  const newPrice = cycle === 'monthly' ? newPlan.price.monthly : newPlan.price.yearly;

  // Choisir entre upgrade et downgrade
  const endpoint = newPrice > currentPrice ? '/subscriptions/upgrade' : '/subscriptions/downgrade';
  
  await fetchWithAuth<any>(token, endpoint, {
    method: 'PUT',
    body: JSON.stringify({ newPlanId }),
  });
  return fetchCurrentSubscription(token);
}

export async function cancelSubscription(
  token: string,
  cancelAtPeriodEnd: boolean,
  reason?: string
): Promise<void> {
  await fetchWithAuth<any>(token, '/subscriptions/cancel', {
    method: 'POST',
    body: JSON.stringify({ cancelAtPeriodEnd, reason }),
  });
}
/**
 * Récupère l'utilisation courante (utilisateurs, stockage, factures du mois)
 * via l'endpoint GET /subscriptions/limits
 */
export async function fetchCurrentUsage(token: string): Promise<{
  currentUsers: number;
  usedStorageGB: number;
  currentMonthInvoices: number;
}> {
  try {
    const data = await fetchWithAuth<any>(token, '/subscriptions/limits');
    // Adaptez selon la structure réelle retournée par votre contrôleur checkSubscriptionLimits
    return {
      currentUsers: data.currentUsers || data.users?.current || 0,
      usedStorageGB: data.usedStorageGB || data.storage?.usedGB || 0,
      currentMonthInvoices: data.currentMonthInvoices || data.invoices?.currentMonth || 0,
    };
  } catch (error) {
    console.error('Failed to fetch current usage:', error);
    return { currentUsers: 0, usedStorageGB: 0, currentMonthInvoices: 0 };
  }
}