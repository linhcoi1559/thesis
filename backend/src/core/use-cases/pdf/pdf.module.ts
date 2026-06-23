import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Module({
  providers: [PdfService, PrismaService],
  controllers: [PdfController],
})
export class PdfModule {}
