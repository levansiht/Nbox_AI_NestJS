import { Body, Controller, Post, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentBodyDTO, IpnCallbackBodyDTO } from './payment.dto';
import { Auth } from 'src/shared/decorator/auth.decorator';
import { AuthType } from 'src/shared/contants/auth.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { AcessTokenPayload } from 'src/shared/types/jwt.type';
import { IsPublic } from 'src/shared/decorator/auth.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/create')
  @Auth([AuthType.Bearer])
  async createPayment(@ActiveUser() user: AcessTokenPayload, @Body() body: CreatePaymentBodyDTO, @Res() res: Response) {
    const htmlForm = await this.paymentService.createPayment(user.userId, body);

    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlForm);
  }

  /**
   * IPN Callback Endpoint
   * SePay gọi endpoint này khi có giao dịch thành công
   * @IsPublic - Không cần authentication vì SePay gọi server-to-server
   */
  @Post('/ipn')
  @IsPublic()
  async handleIpnCallback(@Body() body: IpnCallbackBodyDTO) {

    const result = await this.paymentService.handleIpnCallback(body);

    return result;
  }

  /**
   * Get latest payment info by status for result pages
   */
  @Get('/latest-payment')
  @IsPublic()
  async getLatestPayment(@Query('status') status: 'SUCCESS' | 'FAILED' | 'CANCELLED' = 'SUCCESS') {
    try {
      const payment = await this.paymentService.getLatestPaymentByStatus(status);

      if (!payment) {
        return {
          success: false,
          message: 'No payment found',
          data: null
        };
      }

      return {
        success: true,
        data: {
          orderCode: payment.orderCode,
          amount: payment.amount,
          status: payment.status,
          description: payment.description,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          formattedAmount: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(payment.amount),
          // Include latest IPN data if available
          ipnData: payment.ipnNotifications?.[0] ? {
            orderInvoiceNumber: payment.ipnNotifications[0].orderInvoiceNumber,
            paymentMethod: payment.ipnNotifications[0].paymentMethod,
            transactionId: payment.ipnNotifications[0].transactionId,
            transactionDate: payment.ipnNotifications[0].transactionDate,
          } : null
        }
      };
    } catch (error) {
      console.error('Error getting latest payment:', error);
      return {
        success: false,
        message: 'Unable to fetch payment data',
        error: error.message
      };
    }
  }
}
