// app/types/dashboard.ts

import { z } from "zod";

// --- Helper for safe numbers ---
const safeNumber = z.coerce.number().catch(0);

// --- Helper for transforming arrays from objects (Next.js serialization fix) ---
const safeArray = <T extends z.ZodTypeAny>(schema: T) => 
  z.preprocess((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object' && val !== null) {
      // Convert object with numeric keys to array
      return Object.values(val).filter(v => 
        v && typeof v === 'object' && !('_errors' in v)
      );
    }
    return [];
  }, z.array(schema).default([]));

// --- Client Schema ---
export const ClientSchema = z.object({
  _id: z.string().optional(),
  name: z.string().default("Client"),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
}).passthrough();

// --- Product Schema ---
export const ProductSchema = z.object({
  _id: z.string().catch(() => crypto.randomUUID()),
  code: z.string().default("N/A"),
  name: z.string().default("Produit sans nom"),
  price: safeNumber,
  stock: safeNumber,
  minStock: safeNumber,
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
}).passthrough();

// --- Payment Schema ---
export const PaymentSchema = z.object({
  _id: z.string().catch(() => crypto.randomUUID()),
  amount: safeNumber,
  method: z.string().default("cash"),
  status: z.string().default("completed"),
  reference: z.string().optional(),
  date: z.string().optional(),
  createdAt: z.string().optional(),
  // ✅ FIX: z.record with two parameters
  clientId: z.union([
    z.string(), 
    z.record(z.string(), z.any()), // ✅ z.record(keyType, valueType)
    z.object({ name: z.string() })
  ]).optional(),
  client: ClientSchema.optional(),
}).passthrough();

// --- INVOICE TABLE ITEM SCHEMA ---
export const InvoiceTableItemSchema = z.object({
  _id: z.string(),
  invoiceNumber: z.string().default(''),
  total: safeNumber.optional(),
  amount: safeNumber.optional(),
  paidAmount: safeNumber.optional(),
  dueAmount: safeNumber.optional(),
  balance: safeNumber.optional(),
  status: z.string(),
  clientName: z.string().optional(),
  // ✅ FIX: z.record with two parameters
  clientId: z.union([
    z.string(), 
    z.object({ name: z.string() })
  ]).optional(),
  paidDate: z.union([z.string(), z.number(), z.date()]).optional(),
}).passthrough();

// --- Invoice API Schema ---
export const InvoiceSchema = z.object({
  _id: z.string().catch(() => crypto.randomUUID()),
  number: z.string().optional(),
  invoiceNumber: z.string().optional(),
  // ✅ FIX: z.record with two parameters
  clientId: z.union([
    z.string(), 
    z.record(z.string(), z.any()), // ✅ z.record(keyType, valueType)
    z.object({ name: z.string() })
  ]).optional(),
  client: ClientSchema.optional(),
  clientName: z.string().optional(),
  total: safeNumber,
  amount: safeNumber.optional(),
  paidAmount: safeNumber.default(0),
  dueAmount: safeNumber.default(0),
  balance: safeNumber.default(0),
  shipping: safeNumber.default(0),
  dueDate: z.string().optional().nullable(),
  status: z.string().default("draft"),
  date: z.string().optional(),
  createdAt: z.string().optional(),
  paidDate: z.string().optional().nullable(),
}).passthrough();

// --- Monthly Sales Schema ---
export const MonthlySalesSchema = z.object({
  name: z.string().default(""),
  sales: safeNumber,
  _id: z.number().optional(),
}).passthrough();

// --- Dashboard Stats Schema ---
export const DashboardStatsSchema = z.object({
  stats: z.object({
    invoices: z.object({
      total: safeNumber,
      count: safeNumber,
      paid: safeNumber,
      due: safeNumber,
    }).default({ total: 0, count: 0, paid: 0, due: 0 }),
    payments: z.object({
      total: safeNumber,
      count: safeNumber,
    }).default({ total: 0, count: 0 }),
    clients: z.object({
      total: safeNumber,
      totalBalance: safeNumber,
    }).default({ total: 0, totalBalance: 0 }),
    products: z.object({
      total: safeNumber,
      lowStock: safeNumber,
      totalStockValue: safeNumber,
    }).default({ total: 0, lowStock: 0, totalStockValue: 0 }),
  }).default({
    invoices: { total: 0, count: 0, paid: 0, due: 0 },
    payments: { total: 0, count: 0 },
    clients: { total: 0, totalBalance: 0 },
    products: { total: 0, lowStock: 0, totalStockValue: 0 },
  }),
  
  summary: z.object({
    total: safeNumber,
    count: safeNumber,
    paid: safeNumber,
    due: safeNumber,
  }).default({ total: 0, count: 0, paid: 0, due: 0 }),
  
  byStatus: z.array(z.any()).default([]),
  
  overview: z.object({
    recentInvoices: safeArray(InvoiceTableItemSchema),
    recentPayments: safeArray(PaymentSchema),
    lowStockProducts: safeArray(ProductSchema),
    overdueInvoices: safeArray(InvoiceTableItemSchema).default([]),
  }).default({
    recentInvoices: [],
    recentPayments: [],
    lowStockProducts: [],
    overdueInvoices: [],
  }),
  
  charts: z.object({
    monthlySales: safeArray(MonthlySalesSchema),
    topClients: z.array(z.any()).default([]),
  }).default({
    monthlySales: [],
    topClients: [],
  }),
  
  monthlySalesArr: z.array(z.any()).optional(),
  topClients: z.array(z.any()).optional(),
  recentInvoices: z.array(z.any()).optional(),
  recentPayments: z.array(z.any()).optional(),
  lowStockProducts: z.array(z.any()).optional(),
  
}).passthrough();

// --- Quick Stats Schema ---
export const QuickStatsSchema = z.object({
  today: z.object({
    total: safeNumber,
    count: safeNumber
  }).default({ total: 0, count: 0 }),
  yesterday: z.object({
    total: safeNumber,
    count: safeNumber
  }).default({ total: 0, count: 0 }),
  overdueCount: safeNumber.default(0),
  draftCount: safeNumber.default(0),
  clientCount: safeNumber.default(0),
  revenue: safeNumber.optional(),
  pending: safeNumber.optional(),
  invoices: safeNumber.optional(),
  lowStock: safeNumber.optional(),
}).passthrough();

// --- User Schema ---
export const UserSchema = z.object({
  name: z.string().default("Utilisateur"),
  email: z.string().email(),
  role: z.enum(["admin", "employee", "user"]).default("user"),
  avatar: z.string().optional(),
  tenantName: z.string().optional(),
  tenantId: z.string().optional(),
}).passthrough();

// --- Types Exports ---
export type User = z.infer<typeof UserSchema>;
export type DashboardData = z.infer<typeof DashboardStatsSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceTableItem = z.infer<typeof InvoiceTableItemSchema>;
export type QuickStats = z.infer<typeof QuickStatsSchema>;
export type MonthlySales = z.infer<typeof MonthlySalesSchema>;