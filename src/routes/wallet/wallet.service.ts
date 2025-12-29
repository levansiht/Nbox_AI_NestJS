import { Injectable } from '@nestjs/common';
import { WalletRepo } from './wallet.repo';
import { CreditLogListQueryType, EstimateCostBodyType } from './wallet.model';

@Injectable()
export class WalletService {
  constructor(private readonly walletRepo: WalletRepo) {}

  getBalance(userId: number) {
    return this.walletRepo.getBalance(userId);
  }

  getCreditHistory(userId: number, query: CreditLogListQueryType) {
    return this.walletRepo.getCreditHistory(userId, query);
  }

  estimateCost(userId: number, body: EstimateCostBodyType) {
    return this.walletRepo.estimateCost(userId, body);
  }
}
