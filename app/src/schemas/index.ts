import { z } from "zod";

// Validação antes do banco

export const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const createCategory = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});
export const updateCategory = createCategory.partial();

export const createProduct = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  categoryId: z.number().int().positive(),
});
export const updateProduct = createProduct.partial();

export const listProducts = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  active: z.enum(["true", "false"]).optional(),
  categoryId: z.coerce.number().int().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});
