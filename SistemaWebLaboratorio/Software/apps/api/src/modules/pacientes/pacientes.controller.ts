import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('pacientes')
export class PacientesController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PACIENTE')
  @Get('mis-turnos')
  misTurnos() {
    return { turnos: [] };
  }
}

