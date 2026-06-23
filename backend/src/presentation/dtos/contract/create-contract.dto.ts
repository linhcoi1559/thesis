import { IsString, IsNotEmpty, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @Min(0)
  deposit: number;

  @IsNumber()
  @Min(0)
  rentalPrice: number;
}
