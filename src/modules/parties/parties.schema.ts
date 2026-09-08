import { z } from 'zod';

export const createPartySchema = z.object({
  name: z.string().min(1),
});

export type CreatePartyInput = z.infer<typeof createPartySchema>;

export const updatePartySchema = z.object({
  name: z.string().min(1).optional(),
});

export type UpdatePartyInput = z.infer<typeof updatePartySchema>;

export const partyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});
