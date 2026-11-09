// types/payment.ts

// حالة الدفع
export type PaymentStatus = 'pending' | 'completed' | 'paid' | 'failed' | 'refunded' | 'cancelled';

// طريقة الدفع
export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'PAYPAL' | 'WALLET' | 'MOBILE_MONEY';

// معلومات العميل
export interface ClientInfo {
  _id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
}

// معلومات الفاتورة
export interface InvoiceInfo {
  _id: string;
  invoiceNumber: string;
}

// كائن الدفع
export interface Payment {
  _id: string;
  paymentNumber?: string;
  transactionId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  clientId?: ClientInfo;
  invoiceId?: InvoiceInfo;
  clientName?: string;
  invoiceNumber?: string;
  notes?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  createdBy: string;
}

// استجابة قائمة المدفوعات
export interface PaymentListResponse {
  data: Payment[];
  totalPages: number;
  currentPage: number;
  total: number;
}

// فلتر المدفوعات
export interface PaymentFilters {
  search?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

// إحصائيات المدفوعات
export interface PaymentStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  byStatus: Record<PaymentStatus, number>;
  byMethod: Record<PaymentMethod, number>;
  dailyStats: Array<{ date: string; amount: number; count: number }>;
}

// ============ أنواع البوابات (Gateways) ============

// خيارات البوابة المتاحة للتكوين (مستقاة من القائمة المعروضة في واجهة المستخدم)
export interface GatewayOption {
  code: string;      // معرف فريد للبوابة (مثل 'stripe', 'paypal')
  name: string;      // الاسم التجاري المعروض
  logo?: string;     // رابط شعار البوابة (اختياري)
}

// تكوين البوابة (المفاتيح والإعدادات)
export interface GatewayConfig {
  [key: string]: string | number | boolean | undefined;
}

// البوابة الكاملة بعد حفظها في النظام
export interface Gateway {
  id: string;           // معرف فريد (موحد)
  _id?: string;         // المعرف من قاعدة البيانات (قد يكون موجوداً بدلاً من id)
  name: string;
  code: string;
  isActive: boolean;
  config: GatewayConfig;
  logo?: string;
  publicKey?: string;
  secretKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

// حقل تكوين واحد (للنماذج)
export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: string[];   // للـ select
  sensitive?: boolean;  // هل يجب إخفاؤه عند العرض؟
}