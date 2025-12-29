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


export const CreatePaymentBodySchema = z.object({
  amount: z
    .number()
    .int()
    .min(10000, 'Số tiền nạp tối thiểu là 10,000 VND')
    .max(100000000, 'Số tiền nạp tối đa là 100,000,000 VND'),
  gateway: z.string().max(100).default('BANK_TRANSFER'),
});

export type CreatePaymentBodyType = z.infer<typeof CreatePaymentBodySchema>;

export const CreatePaymentResSchema = z.object({
  paymentId: z.number().int(),
  amount: z.number().int(),
  status: z.string(),
  qrCodeUrl: z.string(),
  bankInfo: z.object({
    bankId: z.string(),
    accountNo: z.string(),
    accountName: z.string(),
    transferContent: z.string(),
  }),
  expiresAt: z.string(),
});

export type CreatePaymentResType = z.infer<typeof CreatePaymentResSchema>;

export const GetPaymentParamsSchema = z.object({
  paymentId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Invalid payment ID'),
});

export type GetPaymentParamsType = z.infer<typeof GetPaymentParamsSchema>;

export const PaymentDetailResSchema = z.object({
  id: z.number().int(),
  amount: z.number().int(),
  status: z.string(),
  gateway: z.string(),
  transferContent: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentDetailResType = z.infer<typeof PaymentDetailResSchema>;

export const ListPaymentsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
});

export type ListPaymentsQueryType = z.infer<typeof ListPaymentsQuerySchema>;

export const PaymentListResSchema = z.object({
  data: z.array(PaymentDetailResSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaymentListResType = z.infer<typeof PaymentListResSchema>;


export const CancelPaymentParamsSchema = GetPaymentParamsSchema;
export type CancelPaymentParamsType = GetPaymentParamsType;
