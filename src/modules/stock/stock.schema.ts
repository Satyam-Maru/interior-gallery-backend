import { z } from 'zod';

// ---------------------------------------------------------------------------
// Bill Item (one product line inside a bill)
// ---------------------------------------------------------------------------
export const billItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().positive(),
  price: z.number().positive(), // price per unit at time of transaction
});

export type BillItemInput = z.infer<typeof billItemSchema>;

// ---------------------------------------------------------------------------
// Create Bill
// ---------------------------------------------------------------------------
export const createBillSchema = z.object({
  /** purchase | sell | purchase_return | sell_return */
  type: z.enum(['purchase', 'sell', 'purchase_return', 'sell_return']),

  /** Party ID */
  party_id: z.number().int().positive().optional(),
  entity_id: z.number().int().positive().optional(),

  /** Required for returns — must reference the original bill */
  original_bill_id: z.number().int().positive().optional(),

  /** At least one product line item */
  items: z.array(billItemSchema).min(1, 'At least one item is required'),

  /**
   * Sequential discounts applied to bill total.
   * e.g. [10, 5] → 10% off first, then 5% off the reduced price.
   * Values are percentages (0–100).
   */
  discounts: z.array(z.number().min(0).max(100)).default([]),

  /** Date of the bill; defaults to now if omitted */
  bill_date: z.string().datetime().optional(),

  note: z.string().optional(),
}).refine(data => data.party_id !== undefined || data.entity_id !== undefined, {
  message: 'party_id is required',
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

// ---------------------------------------------------------------------------
// Create Payment (record a payment against an existing bill)
// ---------------------------------------------------------------------------
export const createPaymentSchema = z.object({
  bill_id: z.number().int().positive(),
  party_id: z.number().int().positive().optional(),
  entity_id: z.number().int().positive().optional(),
  amount: z.number().positive(),
  mode: z.enum(['cash', 'online']),
  paid_at: z.string().datetime().optional(),
  note: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ---------------------------------------------------------------------------
// Query filters for listing bills
// ---------------------------------------------------------------------------
export const getBillsQuerySchema = z.object({
  type: z.enum(['purchase', 'sell', 'purchase_return', 'sell_return']).optional(),
  party_id: z.string().optional(),
  entity_id: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type GetBillsQuery = z.infer<typeof getBillsQuerySchema>;

// ---------------------------------------------------------------------------
// Response Schemas (for documentation / type safety)
// ---------------------------------------------------------------------------
export const billItemResponseSchema = z.object({
  id: z.number(),
  bill_id: z.number(),
  product_id: z.number(),
  quantity: z.number(),
  price: z.number(),
  sub_total: z.number(),
  created_at: z.string(),
});

export const billResponseSchema = z.object({
  id: z.number(),
  type: z.enum(['purchase', 'sell', 'purchase_return', 'sell_return']),
  party_id: z.number().optional(),
  entity_id: z.number().optional(),
  original_bill_id: z.number().nullable(),
  bill_date: z.string(),
  total_amount: z.number(),
  discounts: z.array(z.number()),
  net_amount: z.number(),
  note: z.string().nullable(),
  created_at: z.string(),
});

export const paymentResponseSchema = z.object({
  id: z.number(),
  bill_id: z.number(),
  party_id: z.number().optional(),
  entity_id: z.number().optional(),
  amount: z.number(),
  mode: z.enum(['cash', 'online']),
  paid_at: z.string(),
  note: z.string().nullable(),
  created_at: z.string(),
});
