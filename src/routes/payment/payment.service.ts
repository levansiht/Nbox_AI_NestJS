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
}
