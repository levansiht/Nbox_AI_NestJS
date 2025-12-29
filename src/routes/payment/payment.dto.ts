import { createZodDto } from 'nestjs-zod';
import {
  WebhookPaymentBodySchema,
  CreatePaymentBodySchema,
  CreatePaymentResSchema,
  GetPaymentParamsSchema,
  PaymentDetailResSchema,
  ListPaymentsQuerySchema,
  PaymentListResSchema,
  CancelPaymentParamsSchema,
} from './payment.model';

// Webhook from payment gateway
export class WebhookPaymentBodyDTO extends createZodDto(WebhookPaymentBodySchema) {}

// Create payment order
export class CreatePaymentBodyDTO extends createZodDto(CreatePaymentBodySchema) {}
export class CreatePaymentResDTO extends createZodDto(CreatePaymentResSchema) {}

// Get payment detail
export class GetPaymentParamsDTO extends createZodDto(GetPaymentParamsSchema) {}
export class PaymentDetailResDTO extends createZodDto(PaymentDetailResSchema) {}

// List payments
export class ListPaymentsQueryDTO extends createZodDto(ListPaymentsQuerySchema) {}
export class PaymentListResDTO extends createZodDto(PaymentListResSchema) {}

// Cancel payment
export class CancelPaymentParamsDTO extends createZodDto(CancelPaymentParamsSchema) {}
