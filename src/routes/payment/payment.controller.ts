import { Body, Controller, Post, Res, Headers } from '@nestjs/common';
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
  async handleIpnCallback(@Headers('secret-key') secretKey: string, @Body() body: IpnCallbackBodyDTO) {
    return this.paymentService.handleIpnCallback(secretKey, body);
  }
}
