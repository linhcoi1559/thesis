import { Controller, Post, Get, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { TenantService } from '../../core/use-cases/tenant/tenant.service';
import { CreateTenantDto } from '../dtos/tenant/create-tenant.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LANDLORD, Role.ADMIN)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('landlordId') landlordId: string,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantService.create(landlordId, dto);
  }

  @Get()
  async findAll(@CurrentUser('landlordId') landlordId: string) {
    return this.tenantService.findAllByLandlord(landlordId);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('landlordId') landlordId: string,
    @Param('id') tenantId: string,
  ) {
    return this.tenantService.remove(landlordId, tenantId);
  }
}
