import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req, Delete } from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from '../../../presentation/dtos/contract/create-contract.dto';
import { UpdateContractStatusDto } from '../../../presentation/dtos/contract/update-contract-status.dto';
import { JwtAuthGuard } from '../../../presentation/guards/jwt-auth.guard';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateContractDto) {
    // Only Landlord or Admin can create contract
    const landlordId = req.user.landlordId || req.user.sub;
    return this.contractService.create(landlordId, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    if (req.user.role === 'TENANT') {
      return this.contractService.findAllByTenant(req.user.sub);
    }
    const landlordId = req.user.landlordId || req.user.sub;
    return this.contractService.findAllByLandlord(landlordId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
  ) {
    const landlordId = req.user.landlordId || req.user.sub;
    return this.contractService.updateStatus(id, landlordId, dto);
  }

  @Patch(':id/autopay')
  async toggleAutoPay(
    @Req() req: any,
    @Param('id') id: string,
    @Body('autoPayEnabled') autoPayEnabled: boolean,
  ) {
    return this.contractService.toggleAutoPay(id, req.user.sub, req.user.role, autoPayEnabled);
  }

  @Delete(':id')
  async deleteContract(@Req() req: any, @Param('id') id: string) {
    const landlordId = req.user.landlordId || req.user.sub;
    return this.contractService.delete(id, landlordId);
  }
}
