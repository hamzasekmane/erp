import { z } from "zod";

export const ProductSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, "Le nom est trop court"),
  code: z.string().min(2, "Le code est requis"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "La catégorie est requise"),
  price: z.number().min(0),
  cost: z.number().min(0).optional(),
  stock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  unit: z.enum(['piece', 'kg', 'meter', 'liter', 'box', 'pack']).default('piece'),
  isActive: z.boolean().default(true),
});

export type Product = z.infer<typeof ProductSchema>;

export interface Category {
  _id: string;
  name: string;
  type: string;
}