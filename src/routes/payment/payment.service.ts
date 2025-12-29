import { Injectable } from '@nestjs/common';
import { PaymentRepo } from './payment.repo';
import { WebhookPaymentBodyType, CreatePaymentBodyType, ListPaymentsQueryType } from './payment.model';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepo: PaymentRepo) {}

  createPayment(userId: number, body: CreatePaymentBodyType) {
    return this.paymentRepo.createPayment(userId, body);
  }

  getPaymentById(userId: number, paymentId: number) {
    return this.paymentRepo.getPaymentById(userId, paymentId);
  }

  listPayments(userId: number, query: ListPaymentsQueryType) {
    return this.paymentRepo.listPayments(userId, query);
  }

  cancelPayment(userId: number, paymentId: number) {
    return this.paymentRepo.cancelPayment(userId, paymentId);
  }

  receiver(body: WebhookPaymentBodyType) {
    return this.paymentRepo.receiver(body);
  }
}
