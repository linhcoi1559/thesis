import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreateRentRequestDto } from '../../../presentation/dtos/rent-request/create-rent-request.dto';
import { NotificationGateway } from '../../../presentation/gateways/notification.gateway';

@Injectable()
export class RentRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Persists a Rent/Consultation request from visitors, then sends a real-time event to the landlord
   */
  async create(dto: CreateRentRequestDto) {
    try {
      // 1. Save consultation request into the database
      const rentRequest = await this.prisma.rentRequest.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          message: dto.message,
          landlordId: dto.landlordId,
          roomId: dto.roomId || null,
        },
        include: {
          room: {
            select: {
              roomNumber: true,
            },
          },
        },
      });

      // 2. Broadcast a WebSockets alert to the specific landlord dashboard
      this.notificationGateway.sendToLandlord(
        dto.landlordId,
        'new-rent-request', // Event name
        rentRequest,        // Event payload
      );

      return {
        message: 'Gửi yêu cầu tư vấn thành công',
        data: rentRequest,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi khi gửi yêu cầu tư vấn, vui lòng thử lại sau',
      );
    }
  }

  /**
   * Retrieve all requests for a specific landlord (Dashboard query)
   */
  async findAllByLandlord(landlordId: string) {
    const requests = await this.prisma.rentRequest.findMany({
      where: { landlordId },
      include: { room: { select: { roomNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (requests.length === 0) return requests;

    const emails = requests.map(req => req.email.toLowerCase());
    
    // Find all matching tenants under this landlord
    const existingUsers = await this.prisma.user.findMany({
      where: {
        email: { in: emails },
        role: 'TENANT',
        // In a true SaaS, emails might be unique globally. But let's verify context.
        // The unique constraint is on `email` globally.
      },
      select: {
        email: true,
        status: true,
      }
    });

    const userMap = new Map();
    existingUsers.forEach(user => {
      userMap.set(user.email.toLowerCase(), user.status);
    });

    return requests.map(req => {
      const emailLower = req.email.toLowerCase();
      if (userMap.has(emailLower)) {
        return {
          ...req,
          hasExistingAccount: true,
          existingUserStatus: userMap.get(emailLower),
        };
      }
      return {
        ...req,
        hasExistingAccount: false,
        existingUserStatus: null,
      };
    });
  }

  async updateStatus(landlordId: string, id: string, status: any) {
    return this.prisma.rentRequest.updateMany({
      where: { id, landlordId },
      data: { status }
    });
  }

  async update(landlordId: string, id: string, data: any) {
    return this.prisma.rentRequest.updateMany({
      where: { id, landlordId },
      data
    });
  }

  async remove(landlordId: string, id: string) {
    return this.prisma.rentRequest.deleteMany({
      where: { id, landlordId }
    });
  }
}
