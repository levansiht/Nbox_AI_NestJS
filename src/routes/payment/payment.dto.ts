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

export class WebhookPaymentBodyDTO extends createZodDto(WebhookPaymentBodySchema) {}

export class CreatePaymentBodyDTO extends createZodDto(CreatePaymentBodySchema) {}
export class CreatePaymentResDTO extends createZodDto(CreatePaymentResSchema) {}

export class GetPaymentParamsDTO extends createZodDto(GetPaymentParamsSchema) {}
export class PaymentDetailResDTO extends createZodDto(PaymentDetailResSchema) {}

export class ListPaymentsQueryDTO extends createZodDto(ListPaymentsQuerySchema) {}
export class PaymentListResDTO extends createZodDto(PaymentListResSchema) {}

export class CancelPaymentParamsDTO extends createZodDto(CancelPaymentParamsSchema) {}
