import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async getRoomsByLandlord(landlordIdOrOwnerId: string) {
    // Try to find if the passed ID is an ownerId instead of landlordId (handles legacy tokens)
    const landlord = await this.prisma.landlord.findFirst({
      where: { ownerId: landlordIdOrOwnerId }
    });
    const actualLandlordId = landlord ? landlord.id : landlordIdOrOwnerId;

    return this.prisma.room.findMany({
      where: {
        landlordId: actualLandlordId,
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });
  }

  async getPublicRooms() {
    return this.prisma.room.findMany({
      where: {
        status: 'VACANT',
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });
  }

  async createRoom(landlordId: string, data: any) {
    return this.prisma.room.create({
      data: {
        ...data,
        landlordId,
      },
    });
  }

  async updateRoom(id: string, landlordId: string, data: any) {
    return this.prisma.room.update({
      where: {
        id,
        landlordId, // Ensure landlord owns the room
      },
      data,
    });
  }

  async deleteRoom(id: string, landlordId: string) {
    return this.prisma.room.delete({
      where: {
        id,
        landlordId,
      },
    });
  }

  async addImage(id: string, landlordId: string, imageUrl: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, landlordId },
    });
    if (!room) throw new Error('Room not found');

    const updatedImageUrls = [...room.imageUrls, imageUrl];
    return this.prisma.room.update({
      where: { id },
      data: { imageUrls: updatedImageUrls },
    });
  }

  async removeImage(id: string, landlordId: string, imageUrl: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, landlordId },
    });
    if (!room) throw new Error('Room not found');

    const updatedImageUrls = room.imageUrls.filter(url => url !== imageUrl);
    return this.prisma.room.update({
      where: { id },
      data: { imageUrls: updatedImageUrls },
    });
  }
}
