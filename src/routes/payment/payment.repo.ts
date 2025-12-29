import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import {
  WebhookPaymentBodyType,
  CreatePaymentBodyType,
  CreatePaymentResType,
  PaymentDetailResType,
  ListPaymentsQueryType,
  PaymentListResType,
} from './payment.model';
import { MessageResType } from '../auth/auth.model';
import { parse } from 'date-fns';
import envConfig from 'src/shared/config';
import { PaymentStatus } from 'src/shared/contants/payment.constant';

@Injectable()
export class PaymentRepo {
  constructor(private readonly prismaService: PrismaService) {}

  private generateTransferContent(paymentId: number): string {
    return `${envConfig.PAYMENT_DESCRIPTION_PREFIX}${paymentId}`;
  }

  private generateVietQRUrl(amount: number, transferContent: string): string {
    const bankId = envConfig.BANK_ID;
    const accountNo = envConfig.BANK_ACCOUNT_NO;
    const accountName = encodeURIComponent(envConfig.BANK_ACCOUNT_NAME);
    const template = 'compact2';

    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${accountName}`;
  }

  private parsePaymentIdFromContent(content: string): number | null {
    // Kiểm tra format NBOX{id}
    const prefix = envConfig.PAYMENT_DESCRIPTION_PREFIX;
    const regex = new RegExp(`${prefix}(\\d+)`, 'i');
    const match = content.match(regex);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Fallback: kiểm tra nếu content là số thuần
    const numericContent = content.replace(/\D/g, '');
    if (numericContent) {
      return parseInt(numericContent, 10);
    }

    return null;
  }

  async createPayment(userId: number, body: CreatePaymentBodyType): Promise<CreatePaymentResType> {
    const payment = await this.prismaService.payment.create({
      data: {
        userId,
        amount: body.amount,
        status: PaymentStatus.PENDING,
        gateway: body.gateway || 'BANK_TRANSFER',
      },
    });

    const transferContent = this.generateTransferContent(payment.id);
    const qrCodeUrl = this.generateVietQRUrl(payment.amount, transferContent);

    // Set expiry time (30 phút từ lúc tạo)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return {
      paymentId: payment.id,
      amount: payment.amount,
      status: payment.status,
      qrCodeUrl,
      bankInfo: {
        bankId: envConfig.BANK_ID,
        accountNo: envConfig.BANK_ACCOUNT_NO,
        accountName: envConfig.BANK_ACCOUNT_NAME,
        transferContent,
      },
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getPaymentById(userId: number, paymentId: number): Promise<PaymentDetailResType> {
    const payment = await this.prismaService.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const transferContent = this.generateTransferContent(payment.id);

    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      gateway: payment.gateway,
      transferContent,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  async listPayments(userId: number, query: ListPaymentsQueryType): Promise<PaymentListResType> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [payments, total] = await Promise.all([
      this.prismaService.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.payment.count({ where }),
    ]);

    return {
      data: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        gateway: payment.gateway,
        transferContent: this.generateTransferContent(payment.id),
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cancelPayment(userId: number, paymentId: number): Promise<MessageResType> {
    const payment = await this.prismaService.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== (PaymentStatus.PENDING as string)) {
      throw new BadRequestException('Only pending payments can be cancelled');
    }

    await this.prismaService.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.CANCELLED },
    });

    return { message: 'Payment cancelled successfully' };
  }

  async receiver(body: WebhookPaymentBodyType): Promise<MessageResType> {
    let amountIn = 0;
    let amountOut = 0;
    if (body.transferType === 'in') {
      amountIn = body.transferAmount;
    } else if (body.transferType === 'out') {
      amountOut = body.transferAmount;
    }

    const paymentId = this.parsePaymentIdFromContent(body.content) || this.parsePaymentIdFromContent(body.code || '');

    await this.prismaService.paymentTransaction.create({
      data: {
        paymentId: paymentId || null,
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

    if (!paymentId) {
      console.log('Could not parse payment ID from content:', body.content);
      return { message: 'Transaction recorded (no matching payment found)' };
    }

    const payment = await this.prismaService.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      console.log('Payment not found:', paymentId);
      return { message: 'Transaction recorded (payment not found)' };
    }

    if (body.transferType !== 'in') {
      return { message: 'Transaction recorded (not a deposit)' };
    }

    if (body.transferAmount < payment.amount) {
      console.log(`Insufficient amount: received ${body.transferAmount}, expected ${payment.amount}`);
      return { message: 'Transaction recorded (insufficient amount)' };
    }

    await this.prismaService.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.SUCCESS },
    });

    await this.prismaService.wallet.upsert({
      where: { userId: payment.userId },
      update: {
        balance: { increment: body.transferAmount },
        totalTopUp: { increment: body.transferAmount },
      },
      create: {
        userId: payment.userId,
        balance: body.transferAmount,
        totalTopUp: body.transferAmount,
        totalSpent: 0,
      },
    });

    await this.prismaService.topUp.create({
      data: {
        userId: payment.userId,
        amount: body.transferAmount,
        status: PaymentStatus.SUCCESS,
        gateway: body.gateway,
        transactionId: body.referenceCode,
      },
    });

    return { message: 'Payment completed successfully' };
  }
}
