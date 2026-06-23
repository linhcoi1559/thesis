import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreateContractDto } from '../../../presentation/dtos/contract/create-contract.dto';
import { UpdateContractStatusDto } from '../../../presentation/dtos/contract/update-contract-status.dto';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  async create(landlordId: string, dto: CreateContractDto) {
    // Validate tenant
    const tenant = await this.prisma.user.findFirst({
      where: { id: dto.tenantId, landlordId, role: 'TENANT' },
    });
    if (!tenant) throw new NotFoundException('Khách thuê không tồn tại hoặc không thuộc quyền quản lý');

    // Validate room
    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, landlordId },
    });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    if (room.status === 'OCCUPIED') throw new BadRequestException('Phòng đã có người thuê');

    // Generate unique contract number
    const contractNumber = `HD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    return await this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          contractNumber,
          tenantId: dto.tenantId,
          roomId: dto.roomId,
          landlordId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          deposit: dto.deposit,
          rentalPrice: dto.rentalPrice,
          status: ContractStatus.ACTIVE,
        },
      });

      // Mark room as occupied
      await tx.room.update({
        where: { id: dto.roomId },
        data: { status: 'OCCUPIED' },
      });

      return contract;
    });
  }

  async findAllByLandlord(landlordId: string) {
    return this.prisma.contract.findMany({
      where: { landlordId },
      include: {
        tenant: { select: { name: true, email: true, phone: true } },
        room: { select: { roomNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.contract.findMany({
      where: { tenantId },
      include: { room: { select: { roomNumber: true, price: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, landlordId: string, dto: UpdateContractStatusDto) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, landlordId },
    });
    if (!contract) throw new NotFoundException('Hợp đồng không tồn tại');

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: dto.status },
    });

    // If terminated or expired, mark room as vacant
    if (dto.status === 'TERMINATED' || dto.status === 'EXPIRED') {
      await this.prisma.room.update({
        where: { id: contract.roomId },
        data: { status: 'VACANT' },
      });
    }

    return updated;
  }
}
