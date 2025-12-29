import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { GeminiAction, calculateCost } from '../contants/pricing.constant';

export interface DeductCreditParams {
  userId: number;
  action: GeminiAction;
  imageCount?: number;
  usePro?: boolean;
  resolution?: '2K' | '4K';
  description?: string;
  requestId?: string;
}

export interface DeductCreditResult {
  success: boolean;
  amountDeducted: number;
  newBalance: number;
}

@Injectable()
export class CreditService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBalance(userId: number): Promise<number> {
    const wallet = await this.prismaService.wallet.findUnique({
      where: { userId },
    });
    return wallet?.balance ?? 0;
  }

  async checkBalance(userId: number, requiredAmount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= requiredAmount;
  }

  async deductCredit(params: DeductCreditParams): Promise<DeductCreditResult> {
    const { userId, action, imageCount = 1, usePro = false, resolution = '2K', description, requestId } = params;

    const cost = calculateCost(action, imageCount, usePro, resolution);

    if (cost === 0) {
      return { success: true, amountDeducted: 0, newBalance: await this.getBalance(userId) };
    }

    const wallet = await this.prismaService.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found. Please top up first.');
    }

    if (wallet.balance < cost) {
      throw new BadRequestException(`Insufficient balance. Required: ${cost} VND, Available: ${wallet.balance} VND`);
    }

    const result = await this.prismaService.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: cost },
          totalSpent: { increment: cost },
        },
      });

      await tx.creditLog.create({
        data: {
          userId,
          amount: -cost,
          action,
          description: description || `${action} - ${imageCount} image(s)${usePro ? ' (Pro)' : ''}`,
          requestId,
        },
      });

      return updatedWallet;
    });

    return {
      success: true,
      amountDeducted: cost,
      newBalance: result.balance,
    };
  }

  estimateCost(
    action: GeminiAction,
    imageCount: number = 1,
    usePro: boolean = false,
    resolution: '2K' | '4K' = '2K',
  ): number {
    return calculateCost(action, imageCount, usePro, resolution);
  }
}
