import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRepo } from './payment.repo';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({ name: 'payment' })],
  providers: [PaymentService, PaymentRepo],
  controllers: [PaymentController],
})
export class PaymentModule {}
