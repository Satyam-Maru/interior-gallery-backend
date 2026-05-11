import { z } from 'zod';

export const createStockSchema = z.object({
  type: z.enum(['purchase', 'sell']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  discount: z.number().min(0).max(100).optional().default(0),
  product_id: z.number().int(),
  entity_id: z.number().int(),
});

export type CreateStockInput = z.infer<typeof createStockSchema>;

export const stockResponseSchema = z.object({
  id: z.number(),
  type: z.enum(['purchase', 'sell']),
  quantity: z.number(),
  price: z.number(),
  discount: z.number().nullable(),
  product_id: z.number(),
  entity_id: z.number(),
  created_at: z.string(),
});
