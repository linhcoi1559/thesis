import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ContractStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Cập nhật lại hạn nộp cho các hóa đơn hiện tại...');
    const newDueDate = new Date();
    newDueDate.setDate(10);
    await this.prisma.invoice.updateMany({
      where: { status: 'UNPAID' },
      data: { dueDate: newDueDate }
    });

    // Sửa phòng bị orphan: OCCUPIED nhưng không có hợp đồng ACTIVE
    await this.fixOrphanedRooms();
  }

  async fixOrphanedRooms() {
    this.logger.log('Kiểm tra phòng OCCUPIED không có hợp đồng ACTIVE...');
    const occupiedRooms = await this.prisma.room.findMany({
      where: { status: 'OCCUPIED' },
      select: { id: true, roomNumber: true },
    });

    let fixed = 0;
    for (const room of occupiedRooms) {
      const activeContract = await this.prisma.contract.findFirst({
        where: { roomId: room.id, status: ContractStatus.ACTIVE },
      });
      if (!activeContract) {
        await this.prisma.room.update({
          where: { id: room.id },
          data: { status: 'VACANT' },
        });
        this.logger.log(`Đã trả phòng ${room.roomNumber} về VACANT (không có HĐ ACTIVE).`);
        fixed++;
      }
    }
    if (fixed > 0) {
      this.logger.log(`Đã sửa ${fixed} phòng về VACANT.`);
    }
  }

  /**
   * Chạy vào 00:00 ngày 1 hàng tháng: Tự động sinh hóa đơn tiền phòng
   */
  @Cron('0 0 1 * *')
  async generateMonthlyInvoices() {
    this.logger.log('Bắt đầu sinh hóa đơn tự động hàng tháng...');
    const activeContracts = await this.prisma.contract.findMany({
      where: { status: ContractStatus.ACTIVE },
    });

    let count = 0;
    for (const contract of activeContracts) {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const dueDate = new Date();
      dueDate.setDate(10); // Hạn nộp là mùng 10 hàng tháng

      await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          contractId: contract.id,
          landlordId: contract.landlordId,
          amount: contract.rentalPrice,
          dueDate,
          status: InvoiceStatus.UNPAID,
        },
      });
      count++;
    }
    this.logger.log(`Đã tạo tự động ${count} hóa đơn.`);
  }

  /**
   * Chạy vào 00:00 mỗi ngày: Kiểm tra hợp đồng hết hạn
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredContracts() {
    this.logger.log('Kiểm tra các hợp đồng hết hạn...');
    const now = new Date();

    // Tìm trước để lấy roomIds
    const expiredContracts = await this.prisma.contract.findMany({
      where: {
        status: ContractStatus.ACTIVE,
        endDate: { lt: now },
      },
      select: { id: true, roomId: true },
    });

    if (expiredContracts.length === 0) {
      this.logger.log('Không có hợp đồng nào hết hạn.');
      return;
    }

    // Cập nhật hợp đồng sang EXPIRED
    await this.prisma.contract.updateMany({
      where: { id: { in: expiredContracts.map(c => c.id) } },
      data: { status: ContractStatus.EXPIRED },
    });

    // Trả các phòng tương ứng về VACANT
    await this.prisma.room.updateMany({
      where: { id: { in: expiredContracts.map(c => c.roomId) } },
      data: { status: 'VACANT' },
    });

    this.logger.log(`Đã cập nhật ${expiredContracts.length} hợp đồng sang EXPIRED và trả ${expiredContracts.length} phòng về VACANT.`);
  }
}
