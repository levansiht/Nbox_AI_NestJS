import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { WebhookPaymentBodyType } from './payment.model';
import { MessageResType } from '../auth/auth.model';
import { parse } from 'date-fns';
import { PaymentStatus } from 'src/shared/contants/payment.constant';

@Injectable()
export class PaymentRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async receiver(body: WebhookPaymentBodyType): Promise<MessageResType> {
    let amountIn = 0;
    let amountOut = 0;
    if (body.transferType === 'in') {
      amountIn = body.transferAmount;
    } else if (body.transferType === 'out') {
      amountOut = body.transferAmount;
    }

    await this.prismaService.paymentTransaction.create({
      data: {
        gateway: body.gateway,
        transactionDate: parse(body.transactionDate, 'yyyy-MM-dd HH:mm:ss', new Date()),
        accountNumber: body.accountNumber,
        subAccount: body.subAccount,
        amountIn: amountIn,
        amountOut: amountOut,
        accumulated: body.accumulated,
        code: body.code,
        transactionContent: body.content,
        referenceNumber: body.referenceCode,
        body: body.description,
      },
    });

    const paymentId = body.code ? Number(body.code) : Number(body.content);
    if (isNaN(paymentId)) {
      throw new BadRequestException('Invalid payment ID');
    }
    const payment = await this.prismaService.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }
    const totalPrice = 200000;
    if (body.transferType === 'in' && body.transferAmount !== totalPrice) {
      throw new BadRequestException('Incorrect transfer amount');
    }

    await this.prismaService.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
      },
    });
    return { message: 'Payment transaction recorded successfully' };
  }
}
