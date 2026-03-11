import { z } from "zod/v4";

export const createHoldingSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(10)
    .transform((v) => v.toUpperCase()),
  name: z.string().min(1).max(100),
  shares: z.number().positive(),
  avgCost: z.number().positive(),
  broker: z.string().max(50).optional().default("Default"),
  color: z.string().max(20).optional().default("#6c5ce7"),
});

export const updateHoldingSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(10)
    .transform((v) => v.toUpperCase())
    .optional(),
  name: z.string().min(1).max(100).optional(),
  shares: z.number().positive().optional(),
  avgCost: z.number().positive().optional(),
  broker: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

export type CreateHoldingInput = z.infer<typeof createHoldingSchema>;
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>;
