'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  fetchCurrentSubscription,
  fetchPlans,
  fetchInvoices,
  fetchPaymentMethod,
  fetchBillingInfo,
  changePlan,
  cancelSubscription,
  fetchCurrentUsage,
} from '../services/subscriptionService';

export type ActionState = {
  success: boolean;
  message?: string;
};

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new Error('Unauthorized: No token found');
  return token;
}

export async function getSubscriptionData() {
  const token = await getToken();
  const results = await Promise.allSettled([
    fetchCurrentSubscription(token),
    fetchPlans(token),
    fetchInvoices(token, 5),
    fetchPaymentMethod(token),
    fetchBillingInfo(token),
    fetchCurrentUsage(token), 
  ]);
  return {
    subscription: results[0].status === 'fulfilled' ? results[0].value : null,
    plans: results[1].status === 'fulfilled' ? results[1].value : [],
    invoices: results[2].status === 'fulfilled' ? results[2].value : [],
    paymentMethod: results[3].status === 'fulfilled' ? results[3].value : null,
    billingInfo: results[4].status === 'fulfilled' ? results[4].value : null,
    currentUsage: results[5].status === 'fulfilled' ? results[5].value : { currentUsers: 0, usedStorageGB: 0, currentMonthInvoices: 0 },
  };
}

export async function changePlanAction(formData: FormData): Promise<void> {
  const planId = formData.get('planId') as string;
  const billingCycle = formData.get('billingCycle') as 'monthly' | 'yearly' | null;
  if (!planId) throw new Error('Plan ID required');
  const token = await getToken();
  await changePlan(token, planId, billingCycle || undefined);
  revalidatePath('/dashboard/subscription');
}

export async function cancelSubscriptionAction(formData: FormData): Promise<void> {
  const token = await getToken();
  const cancelAtPeriodEnd = formData.get('cancelAtPeriodEnd') === 'true';
  const reason = formData.get('reason') as string | undefined;
  await cancelSubscription(token, cancelAtPeriodEnd, reason);
  revalidatePath('/dashboard/subscription');
}