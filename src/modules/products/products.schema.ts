import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  unit: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().min(0).default(0),
  category_id: z.number().int(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const productResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string().nullable(),
  price: z.number(),
  quantity: z.number(),
  category_id: z.number(),
});
