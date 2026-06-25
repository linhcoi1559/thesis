import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RentRequestService } from '../../core/use-cases/rent-request/rent-request.service';
import { CreateRentRequestDto } from '../dtos/rent-request/create-rent-request.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('rent-requests')
export class RentRequestController {
  constructor(private readonly rentRequestService: RentRequestService) {}

  /**
   * Public endpoint on Landing Page: Submit rent registration
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRentRequestDto) {
    return this.rentRequestService.create(dto);
  }

  /**
   * Protected Admin Dashboard endpoint: Retrieve consultation list for the current landlord
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LANDLORD, Role.ADMIN)
  async findAll(@CurrentUser('landlordId') landlordId: string) {
    return this.rentRequestService.findAllByLandlord(landlordId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LANDLORD, Role.ADMIN)
  async updateStatus(
    @CurrentUser('landlordId') landlordId: string,
    @Param('id') id: string,
    @Body('status') status: any
  ) {
    return this.rentRequestService.updateStatus(landlordId, id, status);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LANDLORD, Role.ADMIN)
  async update(
    @CurrentUser('landlordId') landlordId: string,
    @Param('id') id: string,
    @Body() data: any
  ) {
    return this.rentRequestService.update(landlordId, id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LANDLORD, Role.ADMIN)
  async remove(
    @CurrentUser('landlordId') landlordId: string,
    @Param('id') id: string
  ) {
    return this.rentRequestService.remove(landlordId, id);
  }
}
