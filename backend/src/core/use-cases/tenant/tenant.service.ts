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
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(landlordId: string, tenantId: string) {
    const tenant = await this.prisma.user.findFirst({
      where: { id: tenantId, landlordId },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy khách thuê này');
    }

    // Chỉ chặn nếu đang có hợp đồng ACTIVE
    const hasActiveContract = await this.prisma.contract.findFirst({
      where: { tenantId, status: 'ACTIVE' },
    });
    if (hasActiveContract) {
      throw new ConflictException('Không thể xóa khách thuê đang có hợp đồng hoạt động. Hãy kết thúc hợp đồng trước.');
    }

    // Xóa tất cả dữ liệu liên quan trong một transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Xóa vi phạm
      await tx.violation.deleteMany({ where: { tenantId } });

      // 2. Xóa sự cố đã báo cáo
      await tx.incident.deleteMany({ where: { reporterId: tenantId } });

      // 3. Xóa hợp đồng cũ (EXPIRED, TERMINATED, PENDING)
      await tx.contract.deleteMany({ where: { tenantId } });

      // 4. Xóa khách thuê
      await tx.user.delete({ where: { id: tenantId } });
    });

    return { message: 'Đã xóa khách thuê thành công' };
  }


  async updateStatus(landlordId: string, tenantId: string, status: string) {
    const tenant = await this.prisma.user.findFirst({
      where: { id: tenantId, landlordId },
      include: { desiredRoom: true }
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy khách thuê này');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: tenantId },
      data: { status: status as any },
      select: { id: true, email: true, name: true, status: true },
    });

    if (status === 'APPROVED' && tenant.desiredRoomId) {
      const existingContract = await this.prisma.contract.findFirst({
        where: { tenantId }
      });
      if (!existingContract) {
         await this.prisma.contract.create({
            data: {
               contractNumber: `CT-${Date.now().toString().slice(-6)}`,
               tenantId: tenant.id,
               roomId: tenant.desiredRoomId,
               startDate: new Date(),
               endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
               deposit: 0,
               rentalPrice: tenant.desiredRoom?.price || 0,
               electricityPrice: 3000,
               waterPrice: 20000,
               memberCount: tenant.memberCount || 1,
               status: 'ACTIVE',
               landlordId: landlordId
            }
         });
         await this.prisma.room.update({
            where: { id: tenant.desiredRoomId },
            data: { status: 'OCCUPIED' }
         });
      }
    }

    return updatedUser;
  }
}
