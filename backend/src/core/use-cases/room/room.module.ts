import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from '../../../presentation/controllers/room.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [RoomController],
  providers: [RoomService, PrismaService],
  exports: [RoomService],
})
export class RoomModule {}
