import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoomService } from '../../core/use-cases/room/room.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import * as path from 'path';

const storage = diskStorage({
  destination: (req, file, cb) => {
    // Save to frontend/public/images/rooms
    const dest = path.join(process.cwd(), '../frontend/public/images/rooms');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `room-${uniqueSuffix}${ext}`);
  }
});

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('public')
  async getPublicRooms() {
    return this.roomService.getPublicRooms();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRooms(@Query('landlordId') queryLandlordId: string, @Req() req: any) {
    const landlordId = req.user?.landlordId || req.user?.sub || queryLandlordId;
    console.log('GET /rooms - landlordId:', landlordId);
    if (!landlordId) return [];
    const rooms = await this.roomService.getRoomsByLandlord(landlordId);
    console.log('Found rooms:', rooms.length);
    return rooms;
  }

  @Post()
  async createRoom(@Body() body: any) {
    // In a real app, landlordId comes from JWT
    const { landlordId, ...data } = body;
    if (!landlordId) throw new BadRequestException('landlordId is required');
    
    // Ensure price is a number
    if (data.price) {
      data.price = Number(data.price);
    }
    return this.roomService.createRoom(landlordId, data);
  }

  @Patch(':id')
  async updateRoom(@Param('id') id: string, @Body() body: any) {
    const { landlordId, ...data } = body;
    if (!landlordId) throw new BadRequestException('landlordId is required');

    if (data.price) {
      data.price = Number(data.price);
    }
    return this.roomService.updateRoom(id, landlordId, data);
  }

  @Delete(':id')
  async deleteRoom(@Param('id') id: string, @Body() body: any, @Query('landlordId') queryLandlordId: string) {
    const landlordId = body.landlordId || queryLandlordId;
    if (!landlordId) throw new BadRequestException('landlordId is required');
    return this.roomService.deleteRoom(id, landlordId);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadImage(
    @Param('id') id: string,
    @Body('landlordId') landlordId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!landlordId) throw new BadRequestException('landlordId is required');
    
    const imageUrl = `/images/rooms/${file.filename}`;
    return this.roomService.addImage(id, landlordId, imageUrl);
  }

  @Delete(':id/images')
  async deleteImage(
    @Param('id') id: string,
    @Body('landlordId') landlordId: string,
    @Body('imageUrl') imageUrl: string
  ) {
    if (!landlordId) throw new BadRequestException('landlordId is required');
    if (!imageUrl) throw new BadRequestException('imageUrl is required');

    return this.roomService.removeImage(id, landlordId, imageUrl);
  }
}
