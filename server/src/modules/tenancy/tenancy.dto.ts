import { z } from "zod";

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).nullish(),
  address: z.string().max(240).nullish(),
  city: z.string().max(120).nullish(),
  country: z.string().min(2).max(80).optional(),
  taxNumber: z.string().max(60).nullish(),
  currency: z.string().length(3).optional(),
  language: z.string().min(2).max(5).optional(),
  timezone: z.string().max(60).optional(),
  logoUrl: z.string().max(2000).nullish(),
});

const notificationsSchema = z
  .object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    alertOnLogin: z.boolean(),
    weeklyReports: z.boolean(),
    newInvoice: z.boolean(),
    paymentReceived: z.boolean(),
    invoiceOverdue: z.boolean(),
    lowStock: z.boolean(),
  })
  .partial();

const integrationsSchema = z
  .object({
    stripe: z.boolean(),
    slack: z.boolean(),
    googleDrive: z.boolean(),
    dropbox: z.boolean(),
    zapier: z.boolean(),
  })
  .partial();

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  dateFormat: z.string().max(30).optional(),
  numberFormat: z.string().max(30).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  invoicePrefix: z.string().min(1).max(12).optional(),
  defaultVatBp: z.number().int().min(0).max(10_000).optional(),
  allowOverpayment: z.boolean().optional(),
  notifications: notificationsSchema.optional(),
  integrations: integrationsSchema.optional(),
});

export const updateSecuritySchema = z.object({
  twoFactorAuth: z.boolean().optional(),
  sessionTimeout: z.number().int().min(15).max(43_200).optional(),
  passwordPolicy: z.enum(["basic", "standard", "strict"]).optional(),
  ipWhitelist: z.array(z.string().max(64)).max(100).optional(),
  allowedDomains: z.array(z.string().max(120)).max(50).optional(),
});

export const changeSubscriptionSchema = z.object({
  planCode: z.string().min(2).max(40),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const cancelSubscriptionSchema = z.object({
  immediately: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateSecurityInput = z.infer<typeof updateSecuritySchema>;
export type ChangeSubscriptionInput = z.infer<typeof changeSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
