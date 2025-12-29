import { createZodDto } from 'nestjs-zod';
import {
  WalletBalanceResSchema,
  CreditLogListQuerySchema,
  CreditLogListResSchema,
  EstimateCostBodySchema,
  EstimateCostResSchema,
} from './wallet.model';

export class WalletBalanceResDTO extends createZodDto(WalletBalanceResSchema) {}
export class CreditLogListQueryDTO extends createZodDto(CreditLogListQuerySchema) {}
export class CreditLogListResDTO extends createZodDto(CreditLogListResSchema) {}
export class EstimateCostBodyDTO extends createZodDto(EstimateCostBodySchema) {}
export class EstimateCostResDTO extends createZodDto(EstimateCostResSchema) {}
