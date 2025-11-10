import { Controller, Get, Post, Body, Req, UseGuards, Param, Delete, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PERSONAL_LAB)
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get('metrics')
  metrics() {
    return this.svc.metrics();
  }

  // Gestión de sesiones
  @Get('sessions/:cedula')
  getUserSessions(@Param('cedula') cedula: string) {
    return this.svc.getUserSessions(cedula);
  }

  @Delete('sessions/:tokenId')
  revokeSession(@Req() req: any, @Param('tokenId') tokenId: string) {
    return this.svc.revokeSession(req.user.sub, parseInt(tokenId));
  }

  @Delete('sessions/user/:cedula')
  revokeAllUserSessions(@Req() req: any, @Param('cedula') cedula: string) {
    return this.svc.revokeAllUserSessions(req.user.sub, cedula);
  }

  // Configuración de facturación
  @Get('billing-config')
  getBillingConfig() {
    return this.svc.getBillingConfig();
  }

  @Put('billing-config')
  updateBillingConfig(@Req() req: any, @Body() config: { iva_percentage: number; default_tax_rate: number }) {
    return this.svc.updateBillingConfig(req.user.sub, config);
  }

  // Estadísticas adicionales
  @Get('stats/users')
  getUserStats() {
    return this.svc.getUserStats();
  }

  @Get('stats/appointments')
  getAppointmentStats() {
    return this.svc.getAppointmentStats();
  }

  @Get('stats/financial')
  getFinancialStats() {
    return this.svc.getFinancialStats();
  }
}

