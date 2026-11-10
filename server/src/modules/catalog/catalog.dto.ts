import { z } from "zod";

export const createProductSchema = z.object({
  code: z.string().min(1).max(60),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  categoryId: z.string().min(1).nullish(),
  price: z.number().finite().nonnegative(),
  cost: z.number().finite().nonnegative().optional(),
  stock: z.number().finite().min(0).optional(),
  minStock: z.number().finite().min(0).optional(),
  unit: z.enum(["piece", "kg", "meter", "liter", "box", "pack"]).default("piece"),
  taxId: z.string().min(1).nullish(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const updateProductStatusSchema = z.object({
  isActive: z.boolean(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const stockMovementSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().finite(),
  unitCost: z.number().finite().nonnegative().optional(),
  reason: z.string().max(300).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullish(),
  type: z.enum(["product", "client", "invoice"]).default("product"),
  color: z.string().max(20).optional(),
  icon: z.string().max(40).optional(),
  parentId: z.string().nullish(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createTaxSchema = z.object({
  name: z.string().min(1).max(120),
  rate: z.number().finite().min(0).max(100).optional(),
  rateBp: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().default(true),
});

export const updateTaxSchema = createTaxSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
