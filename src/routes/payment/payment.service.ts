import { Injectable } from '@nestjs/common';
import { PaymentRepo } from './payment.repo';
import { CreatePaymentBodyType, IpnCallbackBodyType, IpnCallbackResType } from './payment.model';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepo: PaymentRepo) {}

  createPayment(userId: number, body: CreatePaymentBodyType) {
    return this.paymentRepo.createPayment(userId, body);
  }

  handleIpnCallback(body: IpnCallbackBodyType): Promise<IpnCallbackResType> {
    return this.paymentRepo.handleIpnCallback(body);
  }

  getLatestPaymentByStatus(status: 'SUCCESS' | 'FAILED' | 'CANCELLED') {
    return this.paymentRepo.getLatestPaymentByStatus(status);
  }

  createSamplePayment(data: { orderCode: string; amount: number; status: string; description?: string }) {
    return this.paymentRepo.createSamplePayment(data);
  }
}
