import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  WebhookPaymentBodyDTO,
  CreatePaymentBodyDTO,
  CreatePaymentResDTO,
  GetPaymentParamsDTO,
  PaymentDetailResDTO,
  ListPaymentsQueryDTO,
  PaymentListResDTO,
  CancelPaymentParamsDTO,
} from './payment.dto';
import { MessageResDTO } from 'src/shared/models/response.model';
import { Auth, IsPublic } from 'src/shared/decorator/auth.decorator';
import { AuthType } from 'src/shared/contants/auth.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { AcessTokenPayload } from 'src/shared/types/jwt.type';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/create')
  @ZodSerializerDto(CreatePaymentResDTO)
  @Auth([AuthType.Bearer])
  createPayment(@ActiveUser() user: AcessTokenPayload, @Body() body: CreatePaymentBodyDTO) {
    return this.paymentService.createPayment(user.userId, body);
  }

  @Get('/list')
  @ZodSerializerDto(PaymentListResDTO)
  @Auth([AuthType.Bearer])
  listPayments(@ActiveUser() user: AcessTokenPayload, @Query() query: ListPaymentsQueryDTO) {
    return this.paymentService.listPayments(user.userId, query);
  }

  @Get('/:paymentId')
  @ZodSerializerDto(PaymentDetailResDTO)
  @Auth([AuthType.Bearer])
  getPayment(@ActiveUser() user: AcessTokenPayload, @Param() params: GetPaymentParamsDTO) {
    return this.paymentService.getPaymentById(user.userId, params.paymentId);
  }

  @Post('/:paymentId/cancel')
  @ZodSerializerDto(MessageResDTO)
  @Auth([AuthType.Bearer])
  cancelPayment(@ActiveUser() user: AcessTokenPayload, @Param() params: CancelPaymentParamsDTO) {
    return this.paymentService.cancelPayment(user.userId, params.paymentId);
  }

  @Post('/:paymentId/confirm-demo')
  @ZodSerializerDto(MessageResDTO)
  @Auth([AuthType.Bearer])
  confirmPaymentDemo(@ActiveUser() user: AcessTokenPayload, @Param() params: CancelPaymentParamsDTO) {
    return this.paymentService.confirmPaymentDemo(user.userId, params.paymentId);
  }

  @Post('/receiver')
  @ZodSerializerDto(MessageResDTO)
  @IsPublic()
  @Auth([AuthType.PaymentAPIKey], { condition: 'AND' })
  receiver(@Body() body: WebhookPaymentBodyDTO) {
    return this.paymentService.receiver(body);
  }
}
