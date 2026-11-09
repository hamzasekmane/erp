import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).nullish();

export const addressSchema = z
  .object({
    street: optionalText(240),
    city: optionalText(120),
    state: optionalText(120),
    country: optionalText(120),
    postalCode: optionalText(20),
  })
  .partial()
  .nullish();

export const createClientSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(160),
  type: z.enum(["individual", "company"]).default("individual"),
  category: z.enum(["vip", "regular", "wholesale", "retail"]).default("regular"),
  email: z.string().email().nullish().or(z.literal("").transform(() => null)),
  phone: optionalText(40),
  mobile: optionalText(40),
  taxNumber: optionalText(60),
  commercialRegistration: optionalText(60),
  contactPerson: optionalText(120),
  notes: optionalText(2000),
  address: addressSchema,
  billingAddress: addressSchema,
  balance: z.number().finite().optional(),
  creditLimit: z.number().finite().nonnegative().optional(),
  paymentTerms: z.string().max(30).default("net_30"),
  isActive: z.boolean().default(true),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
