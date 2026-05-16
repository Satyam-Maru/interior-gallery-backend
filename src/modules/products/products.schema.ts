import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  unit: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().min(0).default(0),
  category_id: z.number().int(),
  code: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string().nullable(),
  price: z.number(),
  quantity: z.number(),
  category_id: z.number(),
  code: z.string().nullable(),
});
