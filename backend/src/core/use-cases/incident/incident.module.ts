import { Module } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Module({
  providers: [IncidentService, PrismaService],
  controllers: [IncidentController],
})
export class IncidentModule {}
