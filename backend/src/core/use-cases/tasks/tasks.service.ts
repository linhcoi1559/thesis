import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ContractStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      dueDate.setDate(dueDate.getDate() + 5); // Hạn nộp là ngày mùng 5

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

    const result = await this.prisma.contract.updateMany({
      where: {
        status: ContractStatus.ACTIVE,
        endDate: { lt: now },
      },
      data: { status: ContractStatus.EXPIRED },
    });

    this.logger.log(`Đã cập nhật ${result.count} hợp đồng sang trạng thái EXPIRED.`);
  }
}
