import z from 'zod';

export const WalletBalanceResSchema = z.object({
  balance: z.number(),
  totalTopUp: z.number(),
  totalSpent: z.number(),
});

export const CreditLogItemSchema = z.object({
  id: z.number(),
  amount: z.number(),
  action: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const CreditLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreditLogListResSchema = z.object({
  data: z.array(CreditLogItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const EstimateCostBodySchema = z.object({
  action: z.string(),
  imageCount: z.number().int().min(1).default(1),
  usePro: z.boolean().default(false),
  resolution: z.enum(['2K', '4K']).default('2K'),
});

export const EstimateCostResSchema = z.object({
  estimatedCost: z.number(),
  currentBalance: z.number(),
  canAfford: z.boolean(),
});

export type WalletBalanceResType = z.infer<typeof WalletBalanceResSchema>;
export type CreditLogItemType = z.infer<typeof CreditLogItemSchema>;
export type CreditLogListQueryType = z.infer<typeof CreditLogListQuerySchema>;
export type CreditLogListResType = z.infer<typeof CreditLogListResSchema>;
export type EstimateCostBodyType = z.infer<typeof EstimateCostBodySchema>;
export type EstimateCostResType = z.infer<typeof EstimateCostResSchema>;
