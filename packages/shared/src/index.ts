import { z } from 'zod';

export const VoyageStatusSchema = z.enum(['draft', 'estimating', 'fixed', 'completed', 'cancelled']);
export type VoyageStatus = z.infer<typeof VoyageStatusSchema>;

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string().length(3),
});
export type Money = z.infer<typeof MoneySchema>;
