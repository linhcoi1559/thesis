import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

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

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}
