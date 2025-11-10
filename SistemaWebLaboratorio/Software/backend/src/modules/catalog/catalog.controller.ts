import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { CatalogService } from './catalog.service';
import { UpsertServiceDto } from './dtos/upsert-service.dto';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PERSONAL_LAB)
export class CatalogController {
  constructor(private readonly svc: CatalogService) {}

  @Get('services')
  list(){ return this.svc.list(); }

  @Post('services')
  upsert(@Body() body: UpsertServiceDto){ return this.svc.upsert(body); }

  @Delete('services/:codigo')
  remove(@Param('codigo') codigo: string){ return this.svc.remove(codigo); }
}
