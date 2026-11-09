import { z } from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().finite().positive(),
  method: z.string().min(2).max(40).default("CASH"),
  reference: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  paidAt: z.string().datetime().optional(),
});

export const updatePaymentSchema = z.object({
  method: z.string().min(2).max(40).optional(),
  reference: z.string().max(120).nullish(),
  notes: z.string().max(1000).nullish(),
  status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
});

export const refundSchema = z.object({
  amount: z.number().finite().positive(),
  reason: z.string().max(500).optional(),
});

export const reconcileSchema = z.object({
  reconciled: z.boolean().default(true),
});

export const gatewaySchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(80),
  isActive: z.boolean().optional(),
  config: z.record(z.string(), z.string()).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type GatewayInput = z.infer<typeof gatewaySchema>;
