import z from 'zod';

export const PaymentTransactionSchema = z.object({
  id: z.number().int(),
  paymentId: z.number().int(),
  gateway: z.string().max(100),
  transactionDate: z.date(),
  accountNumber: z.string().max(100).nullable().optional(),
  subAccount: z.string().max(250).nullable().optional(),
  amountIn: z.number(),
  amountOut: z.number(),
  accumulated: z.number(),
  code: z.string().max(250).nullable().optional(),
  transactionContent: z.string().nullable().optional(),
  referenceNumber: z.string().max(255).nullable().optional(),
  body: z.string().nullable().optional(),
  createdAt: z.date(),
});

export const WebhookPaymentBodySchema = z.object({
  id: z.number().int(),
  gateway: z.string().max(100),
  transactionDate: z.string(),
  accountNumber: z.string().max(100),
  code: z.string().max(250).nullable(),
  content: z.string(),
  transferType: z.enum(['in', 'out']),
  transferAmount: z.number().int(),
  accumulated: z.number().int(),
  subAccount: z.string().max(250).nullable(),
  referenceCode: z.string().max(255),
  description: z.string(),
});

export type WebhookPaymentBodyType = z.infer<typeof WebhookPaymentBodySchema>;
export type PaymentTransactionType = z.infer<typeof PaymentTransactionSchema>;
