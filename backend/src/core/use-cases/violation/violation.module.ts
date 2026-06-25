import { Module } from '@nestjs/common';
import { ViolationController } from '../../../presentation/controllers/violation.controller';
import { ViolationService } from './violation.service';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Module({
  controllers: [ViolationController],
  providers: [ViolationService, PrismaService],
  exports: [ViolationService],
})
export class ViolationModule {}
