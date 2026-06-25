import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from '../../../presentation/dtos/invoice/create-invoice.dto';
import { UpdateInvoiceStatusDto } from '../../../presentation/dtos/invoice/update-invoice-status.dto';
import { JwtAuthGuard } from '../../../presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../presentation/guards/roles.guard';
import { Roles } from '../../../presentation/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles(Role.LANDLORD, Role.ADMIN)
  async create(@Req() req: any, @Body() dto: CreateInvoiceDto) {
    const landlordId = req.user.landlordId || req.user.sub;
    return this.invoiceService.create(landlordId, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    if (req.user.role === 'TENANT') {
      return this.invoiceService.findAllByTenant(req.user.sub);
    }
    const landlordId = req.user.landlordId || req.user.sub;
    return this.invoiceService.findAllByLandlord(landlordId);
  }

  @Patch(':id/status')
  @Roles(Role.LANDLORD, Role.ADMIN)
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    const landlordId = req.user.landlordId || req.user.sub;
    return this.invoiceService.updateStatus(id, landlordId, dto);
  }

  @Post(':id/pay')
  @Roles(Role.TENANT)
  async pay(@Req() req: any, @Param('id') id: string) {
    return this.invoiceService.pay(id, req.user.sub);
  }
}
