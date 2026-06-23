import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreateTenantDto } from '../../../presentation/dtos/tenant/create-tenant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(landlordId: string, dto: CreateTenantDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã tồn tại trong hệ thống');
    }

    try {
      const defaultPassword = dto.password || 'password123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const tenant = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          name: dto.name,
          phone: dto.phone,
          role: 'TENANT',
          landlordId: landlordId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        }
      });

      return {
        message: 'Thêm khách thuê thành công',
        data: tenant,
      };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi tạo tài khoản khách thuê');
    }
  }

  async findAllByLandlord(landlordId: string) {
    return this.prisma.user.findMany({
      where: {
        landlordId,
        role: 'TENANT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(landlordId: string, tenantId: string) {
    const tenant = await this.prisma.user.findFirst({
      where: {
        id: tenantId,
        landlordId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy khách thuê này');
    }

    const hasContract = await this.prisma.contract.findFirst({
      where: { tenantId },
    });
    if (hasContract) {
      throw new ConflictException('Không thể xóa khách thuê đang có hợp đồng');
    }

    const hasIncident = await this.prisma.incident.findFirst({
      where: { reporterId: tenantId },
    });
    if (hasIncident) {
      throw new ConflictException('Không thể xóa khách thuê đã báo cáo sự cố');
    }

    await this.prisma.user.delete({
      where: { id: tenantId },
    });

    return { message: 'Đã xóa khách thuê thành công' };
  }
}
