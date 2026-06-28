import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from '../../../presentation/controllers/room.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService, PrismaService],
  exports: [RoomService],
})
export class RoomModule {}
