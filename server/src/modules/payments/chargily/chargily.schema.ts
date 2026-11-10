import { z } from "zod";

export const createCheckoutSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive().optional(),
  method: z.enum(["edahabia", "cib"]).optional(),
  locale: z.enum(["ar", "en", "fr"]).optional(),
});

export type CreateCheckoutRequest = z.infer<typeof createCheckoutSchema>;

export interface ChargilyWebhookEvent {
  id?: string;
  entity?: string;
  type?: "checkout.paid" | "checkout.failed" | "checkout.canceled" | "checkout.expired" | string;
  data?: {
    id: string;
    amount?: number;
    currency?: string;
    status?: string;
    payment_method?: string | null;
    metadata?: unknown;
    [key: string]: unknown;
  };
}
