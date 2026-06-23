import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreateInvoiceDto } from '../../../presentation/dtos/invoice/create-invoice.dto';
import { UpdateInvoiceStatusDto } from '../../../presentation/dtos/invoice/update-invoice-status.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

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
}
