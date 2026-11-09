import { z } from "zod";

export const invoiceStatuses = ["draft", "sent", "paid", "partially_paid", "overdue", "cancelled"] as const;

export const invoiceItemSchema = z.object({
  productId: z.string().nullish(),
  description: z.string().min(1).max(500),
  quantity: z.number().finite().positive(),
  unitPrice: z.number().finite().nonnegative(),
  discount: z.number().finite().min(0).max(100).default(0),
  taxRate: z.number().finite().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  date: z.string().optional(),
  dueDate: z.string().min(4),
  items: z.array(invoiceItemSchema).min(1),
  discount: z.number().finite().nonnegative().default(0),
  shipping: z.number().finite().nonnegative().default(0),
  notes: z.string().max(2000).nullish(),
  terms: z.string().max(2000).nullish(),
  status: z.enum(invoiceStatuses).optional(),
  currency: z.string().length(3).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(invoiceStatuses),
});

export const sendInvoiceSchema = z.object({
  sendEmail: z.boolean().optional(),
  email: z.string().email().optional(),
  message: z.string().max(2000).optional(),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;

export const invoicePaymentSchema = z.object({
  amount: z.number().finite().positive().optional(),
  method: z.string().min(2).max(40).default("CASH"),
  reference: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export type InvoicePaymentInput = z.infer<typeof invoicePaymentSchema>;
