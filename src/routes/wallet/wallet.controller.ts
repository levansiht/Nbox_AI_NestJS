import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  WalletBalanceResDTO,
  CreditLogListQueryDTO,
  CreditLogListResDTO,
  TopUpListQueryDTO,
  TopUpListResDTO,
  EstimateCostBodyDTO,
  EstimateCostResDTO,
} from './wallet.dto';
import { Auth } from 'src/shared/decorator/auth.decorator';
import { AuthType } from 'src/shared/contants/auth.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { AcessTokenPayload } from 'src/shared/types/jwt.type';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('/balance')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(WalletBalanceResDTO)
  getBalance(@ActiveUser() user: AcessTokenPayload) {
    return this.walletService.getBalance(user.userId);
  }

  @Get('/credit-history')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CreditLogListResDTO)
  getCreditHistory(@ActiveUser() user: AcessTokenPayload, @Query() query: CreditLogListQueryDTO) {
    return this.walletService.getCreditHistory(user.userId, query);
  }

  @Get('/topup-history')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TopUpListResDTO)
  getTopUpHistory(@ActiveUser() user: AcessTokenPayload, @Query() query: TopUpListQueryDTO) {
    return this.walletService.getTopUpHistory(user.userId, query);
  }

  @Post('/estimate-cost')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(EstimateCostResDTO)
  estimateCost(@ActiveUser() user: AcessTokenPayload, @Body() body: EstimateCostBodyDTO) {
    return this.walletService.estimateCost(user.userId, body);
  }
}
