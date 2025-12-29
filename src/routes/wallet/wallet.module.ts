import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepo } from './wallet.repo';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepo],
  exports: [WalletService],
})
export class WalletModule {}
