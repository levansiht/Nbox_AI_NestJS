import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { CreatePaymentBodyType, CreatePaymentResType, IpnCallbackBodyType, IpnCallbackResType } from './payment.model';
import { SePayPgClient } from 'sepay-pg-node';
import envConfig from 'src/shared/config';
import { PaymentStatus } from 'generated/prisma/enums';

@Injectable()
export class PaymentRepo {
  private sePayClient: SePayPgClient;

  constructor(private readonly prismaService: PrismaService) {
    this.sePayClient = new SePayPgClient({
      env: envConfig.SEPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      merchant_id: envConfig.SEPAY_MERCHANT_ID,
      secret_key: envConfig.SEPAY_SECRET_KEY,
    });
  }

  async createPayment(userId: number, body: CreatePaymentBodyType): Promise<CreatePaymentResType> {
    const existingPayment = await this.prismaService.payment.findUnique({
      where: { orderCode: body.orderCode },
    });

    if (existingPayment) {
      throw new BadRequestException(`Order code ${body.orderCode} already exists`);
    }

    const payment = await this.prismaService.payment.create({
      data: {
        userId,
        orderCode: body.orderCode,
        amount: body.amount,
        description: body.description,
        status: PaymentStatus.PENDING,
      },
    });

    const checkoutURL = this.sePayClient.checkout.initCheckoutUrl();

    const checkoutFormFields = this.sePayClient.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: payment.orderCode,
      order_amount: payment.amount,
      currency: 'VND',
      order_description: body.description || 'Payment for order ' + payment.orderCode,
      success_url: envConfig.SEPAY_SUCCESS_URL,
      error_url: envConfig.SEPAY_ERROR_URL,
      cancel_url: envConfig.SEPAY_CANCEL_URL,
    });

    const htmlForm = this.generateAutoSubmitForm(checkoutURL, checkoutFormFields);

    return htmlForm;
  }

  async handleIpnCallback(body: IpnCallbackBodyType): Promise<IpnCallbackResType> {

    // Store IPN notification for audit trail
    const ipnNotification = await this.prismaService.ipnNotification.create({
      data: {
        notificationType: body.notification_type,
        timestamp: BigInt(body.timestamp),
        orderId: body.order.id,
        orderStatus: body.order.order_status,
        orderAmount: body.order.order_amount,
        orderInvoiceNumber: body.order.order_invoice_number,
        transactionId: body.transaction?.id || null,
        paymentMethod: body.transaction?.payment_method || null,
        transactionStatus: body.transaction?.transaction_status || null,
        transactionAmount: body.transaction?.transaction_amount || null,
        transactionDate: body.transaction?.transaction_date || null,
        rawData: JSON.stringify(body),
      },
    });


    if (body.notification_type !== 'ORDER_PAID') {
      console.log(`⚠️ Ignored notification_type: ${body.notification_type}`);
      return { success: true };
    }

    const payment = await this.prismaService.payment.findUnique({
      where: { orderCode: body.order.order_invoice_number },
    });

    if (!payment) {
      return { success: true }; // Return success để SePay không retry
    }

    // Link IPN notification to payment
    await this.prismaService.ipnNotification.update({
      where: { id: ipnNotification.id },
      data: { paymentId: payment.id },
    });

    if (body.order.order_status !== 'CAPTURED') {
      console.warn(`⚠️ Order status is not CAPTURED: ${body.order.order_status}`);
      return { success: true };
    }

    if (body.transaction.transaction_status !== 'APPROVED') {
      console.warn(`⚠️ Transaction status is not APPROVED: ${body.transaction.transaction_status}`);
      return { success: true };
    }

    const receivedAmount = parseInt(body.transaction.transaction_amount);
    if (receivedAmount < payment.amount) {
      console.warn(`⚠️ Insufficient amount: received ${receivedAmount}, expected ${payment.amount}`);
      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      return { success: true };
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      await this.prismaService.wallet.upsert({
        where: { userId: payment.userId },
        update: {
          balance: { increment: receivedAmount },
          totalTopUp: { increment: receivedAmount },
        },
        create: {
          userId: payment.userId,
          balance: receivedAmount,
          totalTopUp: receivedAmount,
          totalSpent: 0,
        },
      });

      await this.prismaService.topUp.create({
        data: {
          userId: payment.userId,
          amount: receivedAmount,
          status: PaymentStatus.SUCCESS,
          gateway: body.transaction.payment_method,
          transactionId: body.transaction.transaction_id,
          metadata: JSON.stringify(body),
        },
      });

    }
    return { success: true };
  }

  /**
   * Helper: Generate HTML form for auto-submit to SePay
   */
  private generateAutoSubmitForm(actionUrl: string, formFields: Record<string, any>): string {
    const hiddenInputs = Object.entries(formFields)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n    ');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Đang chuyển hướng đến cổng thanh toán...</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .loading {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        p {
            color: #333;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <p>Đang chuyển hướng đến cổng thanh toán SePay...</p>
        <p style="font-size: 14px; color: #666;">Vui lòng chờ trong giây lát</p>
    </div>
    <form id="sepay-checkout-form" method="POST" action="${actionUrl}">
    ${hiddenInputs}
    </form>
    <script>
        window.onload = function() {
            document.getElementById('sepay-checkout-form').submit();
        };
    </script>
</body>
</html>
`;
  }
}
