import z from 'zod';

// ==================== CREATE PAYMENT ====================

export const CreatePaymentBodySchema = z.object({
  orderCode: z.string().min(1, 'Order code is required').max(255),
  amount: z
    .number()
    .int()
    .min(10000, 'Số tiền tối thiểu là 10,000 VND')
    .max(100000000, 'Số tiền tối đa là 100,000,000 VND'),
  description: z.string().min(1, 'Description is required'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CARD']).optional().default('BANK_TRANSFER'),
});

export type CreatePaymentBodyType = z.infer<typeof CreatePaymentBodySchema>;

// Response là HTML form, không cần schema
export type CreatePaymentResType = string;

// ==================== GET PAYMENT STATUS ====================

export const GetPaymentStatusParamsSchema = z.object({
  orderCode: z.string().min(1, 'Order code is required'),
});

export type GetPaymentStatusParamsType = z.infer<typeof GetPaymentStatusParamsSchema>;

export const PaymentStatusResSchema = z.object({
  orderCode: z.string(),
  amount: z.number().int(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED']),
  createdAt: z.string(), // ISO datetime
  paidAt: z.string().nullable(),
});

export type PaymentStatusResType = z.infer<typeof PaymentStatusResSchema>;

// ==================== VERIFY PAYMENT ====================

export const VerifyPaymentBodySchema = z.object({
  orderCode: z.string().min(1, 'Order code is required'),
});

export type VerifyPaymentBodyType = z.infer<typeof VerifyPaymentBodySchema>;

export const VerifyPaymentResSchema = z.object({
  verified: z.boolean(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED']),
});

export type VerifyPaymentResType = z.infer<typeof VerifyPaymentResSchema>;

// ==================== WEBHOOK / IPN CALLBACK ====================

// Schema cho order object trong IPN
const IpnOrderSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  order_status: z.string(), // CAPTURED, etc.
  order_currency: z.string(),
  order_amount: z.string(),
  order_invoice_number: z.string(), // orderCode của chúng ta
  custom_data: z.array(z.any()).optional(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
  order_description: z.string().optional(),
});

// Schema cho transaction object trong IPN
const IpnTransactionSchema = z.object({
  id: z.string(),
  payment_method: z.string(), // BANK_TRANSFER, CARD
  transaction_id: z.string(),
  transaction_type: z.string(),
  transaction_date: z.string(),
  transaction_status: z.string(), // APPROVED, etc.
  transaction_amount: z.string(),
  transaction_currency: z.string(),
  authentication_status: z.string().optional(),
  card_number: z.string().nullable().optional(),
  card_holder_name: z.string().nullable().optional(),
  card_expiry: z.string().nullable().optional(),
  card_funding_method: z.string().nullable().optional(),
  card_brand: z.string().nullable().optional(),
});

// Schema cho customer object trong IPN
const IpnCustomerSchema = z
  .object({
    id: z.string(),
    customer_id: z.string(),
  })
  .nullable()
  .optional();

// Main IPN callback schema
export const IpnCallbackBodySchema = z.object({
  timestamp: z.number().int(), // Unix timestamp
  notification_type: z.string(), // ORDER_PAID, TRANSACTION_VOID
  order: IpnOrderSchema,
  transaction: IpnTransactionSchema,
  customer: IpnCustomerSchema,
});

export type IpnCallbackBodyType = z.infer<typeof IpnCallbackBodySchema>;

export const IpnCallbackResSchema = z.object({
  success: z.boolean(),
});

export type IpnCallbackResType = z.infer<typeof IpnCallbackResSchema>;

// ==================== LIST PAYMENTS (OPTIONAL) ====================

export const ListPaymentsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED']).optional(),
});

export type ListPaymentsQueryType = z.infer<typeof ListPaymentsQuerySchema>;

export const PaymentListItemSchema = z.object({
  id: z.number().int(),
  orderCode: z.string(),
  amount: z.number().int(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED']),
  description: z.string().nullable(),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
});

export const PaymentListResSchema = z.object({
  data: z.array(PaymentListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaymentListResType = z.infer<typeof PaymentListResSchema>;
