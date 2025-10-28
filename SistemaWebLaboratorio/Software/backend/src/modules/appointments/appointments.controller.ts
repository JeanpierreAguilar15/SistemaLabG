import { Controller, Get, Query, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly svc: AppointmentsService) {}

  @Get('disponibilidad')
  disponibilidad(
    @Query('codigo_servicio') codigo_servicio: string,
    @Query('codigo_sede') codigo_sede: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.svc.disponibilidad(codigo_servicio, codigo_sede, desde, hasta);
  }

  @Post('crear')
  crear(@Req() req: any, @Body() body: { codigo_servicio: string; slot_id: number }) {
    return this.svc.crearCita(req.user.sub, body.codigo_servicio, body.slot_id);
  }

  @Post('cancelar')
  cancelar(@Req() req: any, @Body() body: { numero_cita: number; motivo: string }) {
    return this.svc.cancelarCita(req.user.sub, body.numero_cita, body.motivo);
  }
}

