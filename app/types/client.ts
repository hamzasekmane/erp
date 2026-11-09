import { z } from "zod";

// ===== SCHÉMAS ZOD =====

// Schéma pour l'adresse
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
}).optional();

// Schéma principal du client
export const ClientSchema = z.object({
  _id: z.string(),
  tenantId: z.string().optional(),
  code: z.string().min(1, "Le code est requis"),
  name: z.string().min(1, "Le nom est requis"),
  type: z.enum(['individual', 'company']).default('individual'),
  taxNumber: z.string().optional().nullable(),
  commercialRegistration: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email("Email invalide").optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: AddressSchema,
  billingAddress: AddressSchema,
  notes: z.string().optional().nullable(),
  balance: z.number().default(0),
  creditLimit: z.number().default(0),
  paymentTerms: z.string().default('net_30'),
  category: z.enum(['vip', 'regular', 'wholesale', 'retail']).default('regular'),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional(),
});

// Types inférés - ✅ PAS DE CONFLIT DE NOMS
export type Client = z.infer<typeof ClientSchema>;
export type Address = z.infer<typeof AddressSchema>;

// Schéma pour la création (omission des champs auto-générés)
export const CreateClientSchema = ClientSchema.omit({ 
  _id: true, 
  tenantId: true,
  balance: true,
  createdAt: true,
  updatedAt: true 
}).partial({
  paymentTerms: true,
  category: true,
  isActive: true,
});

export type CreateClient = z.infer<typeof CreateClientSchema>;

// Schéma pour la mise à jour
export const UpdateClientSchema = CreateClientSchema.partial();
export type UpdateClient = z.infer<typeof UpdateClientSchema>;

// Schéma pour la réponse API (liste de clients)
export const ClientsResponseSchema = z.object({
  data: z.array(ClientSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }).optional(),
});
export type ClientsResponse = z.infer<typeof ClientsResponseSchema>;

// Schéma pour la réponse d'un client unique
export const ClientResponseSchema = z.object({
  data: ClientSchema,
});
export type ClientResponse = z.infer<typeof ClientResponseSchema>;

// Type pour les statistiques du client
export const ClientStatsSchema = z.object({
  totalInvoices: z.number().optional(),
  totalSpent: z.number().optional(),
  totalPaid: z.number().optional(),
  totalDue: z.number().optional(),
  lastInvoiceDate: z.string().optional().nullable(),
  averageInvoice: z.number().optional(),
}).nullable();
export type ClientStats = z.infer<typeof ClientStatsSchema>;

// Type pour les détails complets (profil + stats)
export const ClientFullDetailsSchema = z.object({
  profile: ClientSchema,
  stats: ClientStatsSchema,
});
export type ClientFullDetails = z.infer<typeof ClientFullDetailsSchema>;