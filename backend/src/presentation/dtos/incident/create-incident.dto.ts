import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { IncidentPriority } from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsEnum(IncidentPriority)
  @IsOptional()
  priority?: IncidentPriority;
}
