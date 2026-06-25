import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreateIncidentDto } from '../../../presentation/dtos/incident/create-incident.dto';
import { UpdateIncidentStatusDto } from '../../../presentation/dtos/incident/update-incident-status.dto';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class IncidentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(tenantId: string, dto: CreateIncidentDto) {
    const tenant = await this.prisma.user.findUnique({
      where: { id: tenantId },
      select: { landlordId: true, name: true },
    });

    let landlordId = tenant?.landlordId;
    if (!landlordId) {
       const contract = await this.prisma.contract.findFirst({
          where: { tenantId, roomId: dto.roomId }
       });
       landlordId = contract?.landlordId;
    }

    if (!landlordId) {
      throw new NotFoundException('Khách thuê không hợp lệ hoặc chưa thuộc nhà trọ nào');
    }

    let incident;
    try {
      incident = await this.prisma.incident.create({
        data: {
          title: dto.title,
          description: dto.description,
          priority: dto.priority || 'LOW',
          roomId: dto.roomId,
          reporterId: tenantId,
          landlordId: landlordId,
        },
      });
    } catch (err: any) {
      throw new InternalServerErrorException('Lỗi CSDL: ' + err.message);
    }

    // Phát thông báo Real-time cho Chủ trọ
    try {
      this.notificationGateway.sendNotificationToLandlord(
        landlordId,
        'Sự cố mới được báo cáo',
        `Khách thuê ${tenant?.name || 'Vô danh'} vừa báo sự cố mới: ${dto.title}`,
      );
    } catch (err) {
      console.error('Failed to send notification to landlord', err);
    }

    return incident;
  }

  async findAllByLandlord(landlordId: string) {
    return this.prisma.incident.findMany({
      where: { landlordId },
      include: {
        reporter: { select: { name: true, phone: true } },
        room: { select: { roomNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.incident.findMany({
      where: { reporterId: tenantId },
      include: {
        room: { select: { roomNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, landlordId: string, dto: UpdateIncidentStatusDto) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, landlordId },
    });
    if (!incident) throw new NotFoundException('Sự cố không tồn tại');

    return this.prisma.incident.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
