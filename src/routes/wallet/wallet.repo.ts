import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import {
  WalletBalanceResType,
  CreditLogListQueryType,
  CreditLogListResType,
  EstimateCostBodyType,
  EstimateCostResType,
} from './wallet.model';
import { GeminiAction, calculateCost } from 'src/shared/contants/pricing.constant';

@Injectable()
export class WalletRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async getBalance(userId: number): Promise<WalletBalanceResType> {
    let wallet = await this.prismaService.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prismaService.wallet.create({
        data: { userId },
      });
    }

    return {
      balance: wallet.balance,
      totalTopUp: wallet.totalTopUp,
      totalSpent: wallet.totalSpent,
    };
  }

  async getCreditHistory(userId: number, query: CreditLogListQueryType): Promise<CreditLogListResType> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.creditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.creditLog.count({ where: { userId } }),
    ]);

    return {
      data: data.map((log) => ({
        id: log.id,
        amount: log.amount,
        action: log.action,
        description: log.description,
        createdAt: log.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async estimateCost(userId: number, body: EstimateCostBodyType): Promise<EstimateCostResType> {
    const action = body.action as GeminiAction;
    const estimatedCost = calculateCost(action, body.imageCount, body.usePro, body.resolution);

    const wallet = await this.prismaService.wallet.findUnique({
      where: { userId },
    });

    const currentBalance = wallet?.balance ?? 0;

    return {
      estimatedCost,
      currentBalance,
      canAfford: currentBalance >= estimatedCost,
    };
  }
}
