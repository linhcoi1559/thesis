import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [InvoiceService, PrismaService],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
