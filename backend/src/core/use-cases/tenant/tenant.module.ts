import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from '../../../presentation/controllers/tenant.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [TenantController],
  providers: [TenantService, PrismaService],
})
export class TenantModule {}
