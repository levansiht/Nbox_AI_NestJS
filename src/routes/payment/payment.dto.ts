import { createZodDto } from 'nestjs-zod';
import {
  CreatePaymentBodySchema,
  GetPaymentStatusParamsSchema,
  PaymentStatusResSchema,
  VerifyPaymentBodySchema,
  VerifyPaymentResSchema,
  IpnCallbackBodySchema,
  IpnCallbackResSchema,
  ListPaymentsQuerySchema,
  PaymentListResSchema,
} from './payment.model';

// ==================== CREATE PAYMENT ====================
export class CreatePaymentBodyDTO extends createZodDto(CreatePaymentBodySchema) {}
// Response là HTML string, không cần DTO

// ==================== GET PAYMENT STATUS ====================
export class GetPaymentStatusParamsDTO extends createZodDto(GetPaymentStatusParamsSchema) {}
export class PaymentStatusResDTO extends createZodDto(PaymentStatusResSchema) {}

// ==================== IPN CALLBACK ====================
export class IpnCallbackBodyDTO extends createZodDto(IpnCallbackBodySchema) {}
export class IpnCallbackResDTO extends createZodDto(IpnCallbackResSchema) {}

// ==================== VERIFY PAYMENT ====================
export class VerifyPaymentBodyDTO extends createZodDto(VerifyPaymentBodySchema) {}
export class VerifyPaymentResDTO extends createZodDto(VerifyPaymentResSchema) {}

// ==================== LIST PAYMENTS ====================
export class ListPaymentsQueryDTO extends createZodDto(ListPaymentsQuerySchema) {}
export class PaymentListResDTO extends createZodDto(PaymentListResSchema) {}
