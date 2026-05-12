import { z } from 'zod';

export const createEntitySchema = z.object({
  name: z.string().min(1),
  location_id: z.number().int().optional(),
  type: z.enum(['supplier', 'customer']),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;

export const updateEntitySchema = z.object({
  name: z.string().min(1).optional(),
  location_id: z.number().int().optional(),
  type: z.enum(['supplier', 'customer']).optional(),
});

export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;

export const entityResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  location_id: z.number().nullable(),
  type: z.enum(['supplier', 'customer']),
});
