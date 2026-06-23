import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from '../../../presentation/dtos/incident/create-incident.dto';
import { UpdateIncidentStatusDto } from '../../../presentation/dtos/incident/update-incident-status.dto';
import { JwtAuthGuard } from '../../../presentation/guards/jwt-auth.guard';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateIncidentDto) {
    return this.incidentService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    if (req.user.role === 'TENANT') {
      return this.incidentService.findAllByTenant(req.user.sub);
    }
    const landlordId = req.user.landlordId || req.user.sub;
    return this.incidentService.findAllByLandlord(landlordId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    const landlordId = req.user.landlordId || req.user.sub;
    return this.incidentService.updateStatus(id, landlordId, dto);
  }
}
