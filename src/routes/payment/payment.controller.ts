import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { WebhookPaymentBodyDTO } from './payment.dto';
import { MessageResDTO } from 'src/shared/models/response.model';
import { Auth, IsPublic } from 'src/shared/decorator/auth.decorator';
import { AuthType } from 'src/shared/contants/auth.constant';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/receiver')
  @ZodSerializerDto(MessageResDTO)
  @IsPublic()
  @Auth([AuthType.PaymentAPIKey], { condition: 'AND' })
  receiver(@Body() body: WebhookPaymentBodyDTO) {
    return this.paymentService.receiver(body);
  }
}
