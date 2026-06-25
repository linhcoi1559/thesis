import { Controller, Post, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ViolationService } from '../../core/use-cases/violation/violation.service';
import { CreateViolationDto } from '../dtos/violation/create-violation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('violations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ViolationController {
  constructor(private readonly violationService: ViolationService) {}

  @Post()
  @Roles('ADMIN', 'LANDLORD')
  async create(@CurrentUser() user: any, @Body() dto: CreateViolationDto) {
    const landlordId = user.role === 'ADMIN' ? user.id : user.landlordId;
    return this.violationService.create(landlordId, dto);
  }

  @Get('tenant/:tenantId')
  @Roles('ADMIN', 'LANDLORD')
  async getByTenantForAdmin(@CurrentUser() user: any, @Param('tenantId') tenantId: string) {
    const landlordId = user.role === 'ADMIN' ? user.id : user.landlordId;
    return this.violationService.findAllByLandlord(landlordId, tenantId);
  }

  @Get()
  @Roles('TENANT')
  async getMyViolations(@CurrentUser() user: any) {
    return this.violationService.findAllByTenant(user.id);
  }

  @Patch(':id/resolve')
  @Roles('ADMIN', 'LANDLORD')
  async resolve(@CurrentUser() user: any, @Param('id') id: string) {
    const landlordId = user.role === 'ADMIN' ? user.id : user.landlordId;
    return this.violationService.resolve(landlordId, id);
  }
}
