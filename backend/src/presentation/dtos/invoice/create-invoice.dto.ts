import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  electricityCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  waterCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  otherCost?: number;
}
