import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Module({
  providers: [TasksService, PrismaService]
})
export class TasksModule {}
