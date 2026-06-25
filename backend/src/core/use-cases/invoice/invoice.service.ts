import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreateInvoiceDto } from '../../../presentation/dtos/invoice/create-invoice.dto';
import { UpdateInvoiceStatusDto } from '../../../presentation/dtos/invoice/update-invoice-status.dto';
import { InvoiceStatus } from '@prisma/client';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway
  ) {}

  async create(landlordId: string, dto: CreateInvoiceDto) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: dto.contractId, landlordId },
    });
    if (!contract) throw new NotFoundException('Hợp đồng không tồn tại');

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        contractId: dto.contractId,
        landlordId,
        amount: dto.amount,
        electricityCost: dto.electricityCost,
        waterCost: dto.waterCost,
        otherCost: dto.otherCost,
        dueDate: new Date(dto.dueDate),
        status: InvoiceStatus.UNPAID,
      },
    });
  }

  async findAllByLandlord(landlordId: string) {
    return this.prisma.invoice.findMany({
      where: { landlordId },
      include: {
        contract: {
          include: {
            tenant: { select: { name: true, email: true } },
            room: { select: { roomNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { contract: { tenantId } },
      include: {
        contract: {
          include: { room: { select: { roomNumber: true } } },
        },
        landlord: {
          select: {
            bankName: true,
            bankAccountNumber: true,
            bankAccountName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, landlordId: string, dto: UpdateInvoiceStatusDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, landlordId },
    });
    if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại');

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
        paidDate: dto.status === 'PAID' ? new Date() : null,
      },
    });
  }

  async pay(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { 
        id, 
        contract: { tenantId } 
      },
      include: {
        contract: {
          include: { room: true, tenant: true }
        }
      }
    });

    if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại hoặc bạn không có quyền');

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidDate: new Date(),
      },
    });

    // Notify landlord
    const roomNumber = invoice.contract.room.roomNumber;
    const tenantName = invoice.contract.tenant.name;
    this.notificationGateway.sendNotificationToLandlord(
      invoice.landlordId,
      'Thanh toán mới',
      `Khách ${tenantName} (Phòng ${roomNumber}) vừa báo thanh toán hóa đơn ${invoice.invoiceNumber}. Vui lòng kiểm tra tài khoản.`
    );

    return updated;
  }
}
