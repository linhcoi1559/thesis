import { Controller, Get, Param, Res, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { JwtAuthGuard } from '../../../presentation/guards/jwt-auth.guard';

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('invoice/:id')
  async exportInvoice(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const landlordId = req.user.landlordId || req.user.sub;

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, landlordId },
      include: {
        contract: {
          include: {
            room: true,
            tenant: true,
          }
        },
        landlord: true,
      }
    });

    if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại');

    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
