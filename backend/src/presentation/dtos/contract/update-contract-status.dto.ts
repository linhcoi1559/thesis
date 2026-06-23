import { IsEnum, IsOptional } from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;
}
