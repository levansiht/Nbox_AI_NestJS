import { createZodDto } from 'nestjs-zod';
import {
  WalletBalanceResSchema,
  CreditLogListQuerySchema,
  CreditLogListResSchema,
  TopUpListQuerySchema,
  TopUpListResSchema,
  EstimateCostBodySchema,
  EstimateCostResSchema,
} from './wallet.model';

export class WalletBalanceResDTO extends createZodDto(WalletBalanceResSchema) {}
export class CreditLogListQueryDTO extends createZodDto(CreditLogListQuerySchema) {}
export class CreditLogListResDTO extends createZodDto(CreditLogListResSchema) {}
export class TopUpListQueryDTO extends createZodDto(TopUpListQuerySchema) {}
export class TopUpListResDTO extends createZodDto(TopUpListResSchema) {}
export class EstimateCostBodyDTO extends createZodDto(EstimateCostBodySchema) {}
export class EstimateCostResDTO extends createZodDto(EstimateCostResSchema) {}
