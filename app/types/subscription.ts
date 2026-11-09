// frontend/types/subscription.ts

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  startDate: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    users: { used: number; limit: number };
    storage: { used: number; limit: number; unit: string };
    apiCalls: { used: number; limit: number };
  };
}
export interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  limitations: string[];
  popular: boolean;
  color: string;
  borderColor: string;
  textColor: string;
  buttonColor: string;
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