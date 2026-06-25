import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreateViolationDto } from '../../../presentation/dtos/violation/create-violation.dto';

@Injectable()
export class ViolationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(landlordId: string, dto: CreateViolationDto) {
    const tenant = await this.prisma.user.findFirst({
      where: { id: dto.tenantId, landlordId, role: 'TENANT' },
    });
    if (!tenant) throw new NotFoundException('Khách thuê không tồn tại');

    return this.prisma.violation.create({
      data: {
        description: dto.description,
        tenantId: dto.tenantId,
        landlordId,
      },
    });
  }

  async findAllByLandlord(landlordId: string, tenantId?: string) {
    return this.prisma.violation.findMany({
      where: { 
        landlordId,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        tenant: { select: { name: true, email: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.violation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(landlordId: string, id: string) {
    const violation = await this.prisma.violation.findFirst({
      where: { id, landlordId },
    });
    if (!violation) throw new NotFoundException('Không tìm thấy vi phạm');

    return this.prisma.violation.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });
  }
}
