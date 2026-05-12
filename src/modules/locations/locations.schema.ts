import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

export const locationResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});
