import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Module({
  providers: [ContractService, PrismaService],
  controllers: [ContractController],
})
export class ContractModule {}
