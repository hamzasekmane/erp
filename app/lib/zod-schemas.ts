import { z } from "zod";

/**
 * 1. AUTH & PROFILE SCHEMAS
 */
export const registerSchema = z.object({
  businessName: z.string().min(2, "Nom de l'entreprise requis"),
  taxNumber: z.string().min(5, "Numéro fiscal requis"),
  name: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  planCode: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().optional().default("Adresse non spécifiée"),
  city: z.string().optional().default("Ville non spécifiée"),
  postalCode: z.string().optional().default("16000"), // ← 5 chiffres
  country: z.string().optional().default("Algérie"),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
});

export const UserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  tenantId: z.string().optional(),
});

/**
 * 2. CATEGORY SCHEMA
 */
export const CategorySchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  description: z.string().optional().nullable(),
  type: z.string().default("product"),
  parentId: z.string().nullable().default(null),
  color: z.string().default("#0891b2"),
  icon: z.string().default("tag"),
  isActive: z.boolean().default(true),
});

/**
 * 3. DASHBOARD STATISTICS SCHEMA
 * Correction : Ajout de LowStockProductSchema pour valider les produits en alerte
 * sans faire crash l'application si categoryId est undefined.
 */

const LowStockProductSchema = z.object({
  _id: z.string(),
  name: z.string(),
  stock: z.number().default(0),
  minStock: z.number().optional().default(0),
  // On rend categoryId optionnel et nullable pour la robustesse du Dashboard
  categoryId: z.union([z.string(), z.any()]).optional().nullable(),
  code: z.string().optional().nullable(),
});

export const DashboardStatsSchema = z.object({
  stats: z.object({
    invoices: z.object({
      total: z.number().default(0),
      count: z.number().default(0),
      paid: z.number().default(0),
      due: z.number().default(0),
    }),
    payments: z.object({
      total: z.number().default(0),
      count: z.number().default(0),
    }),
    clients: z.object({
      total: z.number().default(0),
      totalBalance: z.number().nullable().default(0),
    }),
    products: z.object({
      total: z.number().default(0),
      lowStock: z.number().default(0),
      totalStockValue: z.number().default(0),
    }),
  }),
  overview: z.object({
    recentInvoices: z.array(z.any()).default([]),
    recentPayments: z.array(z.any()).default([]),
    // Utilisation du schéma sécurisé ici
    lowStockProducts: z.array(LowStockProductSchema).default([]),
  }),
  charts: z.object({
    monthlySales: z
      .array(
        z.object({
          name: z.string(),
          sales: z.number(),
        }),
      )
      .optional()
      .default([]),
    topClients: z.array(z.any()).optional().default([]),
  }),
});

/**
 * 4. CLIENT & PRODUCT SCHEMAS
 */
export const clientSchema = z.object({
  name: z.string().min(3, "اسم العميل يجب أن يكون 3 أحرف على الأقل"),
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),
  phone: z.string().min(8, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
  type: z.enum(["individual", "company"]),
  category: z.string().default("regular"),
});

export const ProductSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  code: z.string().min(2, "Le code est requis"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "La catégorie est requise"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  stock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif"),
  minStock: z.coerce.number().int().min(0).default(5).catch(5),
  unit: z.enum(["piece", "kg", "meter", "liter", "box", "pack"]).default("piece"),
  isActive: z.preprocess(
    (val) => val === "true" || val === "on" || val === true,
    z.boolean().default(true)
  ),
});
export const InvoiceSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  dueDate: z.string().min(1, "تاريخ الاستحقاق مطلوب"),
  items: z.array(z.object({
    productId: z.string().optional().nullable(),
    description: z.string().min(1, "الوصف مطلوب"),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0)
  })).min(1, "يجب إضافة عنصر واحد على الأقل"),
  discount: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0), // <--- ADD THIS LINE
  notes: z.string().optional().nullable(),
});
/**
 * 5. TENANT & SETTINGS SCHEMAS
 */
export const updateTenantSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  businessName: z.string().min(2, "La raison sociale est requise"),
  taxNumber: z.string().regex(/^\d{9}(\d{5})?$/, "SIREN (9 chiffres) ou SIRET (14 chiffres) invalide"),
  tvaIntra: z.string().optional(),
  currency: z.string().default("EUR"),
  address: z.object({
    street: z.string().min(1, "La rue est requise"),
    city: z.string().min(1, "La ville est requise"),
    country: z.string().default("France"),
    postalCode: z.string().regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  }),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email("Email de contact invalide"), // هذا الحقل كان ينقصك!
  }),
  settings: z.object({
    invoice: z.object({
      prefix: z.string().default("FA-"),
      nextNumber: z.coerce.number().default(1),
    }),
    tax: z.object({
      defaultVat: z.coerce.number().default(20),
    }),
  }),
});
/**
 * EXPORTED TYPES
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type DashboardData = z.infer<typeof DashboardStatsSchema>;
export type UserProfile = z.infer<typeof UserSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;