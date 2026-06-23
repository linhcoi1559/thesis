import { IsEnum, IsNotEmpty } from 'class-validator';
import { IncidentStatus } from '@prisma/client';

export class UpdateIncidentStatusDto {
  @IsEnum(IncidentStatus)
  @IsNotEmpty()
  status: IncidentStatus;
}
