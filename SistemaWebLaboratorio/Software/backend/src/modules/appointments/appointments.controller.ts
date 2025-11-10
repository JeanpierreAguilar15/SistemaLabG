import { Controller, Get, Query, Post, Body, UseGuards, Req, Delete, Param, Put } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { CreateAppointmentDto } from './dtos/create-appointment.dto';
import { UpdateAppointmentDto } from './dtos/update-appointment.dto';
import { GenerateSlotsDto } from './dtos/generate-slots.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly svc: AppointmentsService) {}

  @Get('sedes')
  sedes(){ return this.svc.listSedes(); }

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

  // admin: generar slots para un rango de fechas con reglas por defecto
  @Post('generar-slots')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  generarSlots(@Body() body: { codigo_servicio: string; codigo_sede: string; desde: string; hasta: string; paso_min?: number; cupo?: number; horario?: Record<string, { inicio:string; fin:string }[]> }) {
    const { codigo_servicio, codigo_sede, desde, hasta, paso_min, cupo, horario } = body || ({} as any);
    return this.svc.generarSlots({ codigo_servicio, codigo_sede, desde, hasta, pasoMin: paso_min ?? 30, cupo: cupo ?? 1, horario });
  }

  // listar citas del usuario autenticado
  @Get('mis-citas')
  misCitas(@Req() req: any) {
    return this.svc.listarCitas(req.user.sub);
  }

  // reprogramar cita a otro slot
  @Post('reprogramar')
  reprogramar(@Req() req: any, @Body() body: { numero_cita: number; nuevo_slot_id: number }) {
    return this.svc.reprogramarCita(req.user.sub, body.numero_cita, body.nuevo_slot_id);
  }

  // admin: listar citas recientes
  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  listarAdmin(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.svc.listarCitasAdmin(desde, hasta);
  }

  // Admin: Crear nueva cita
  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  crearCitaAdmin(@Body() body: {
    cedula: string;
    codigo_servicio: string;
    sede: string;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
    observaciones?: string;
    estado?: string;
  }) {
    return this.svc.crearCitaAdmin(body);
  }

  // Admin: Actualizar cita existente
  @Put('admin/update/:numero_cita')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  actualizarCitaAdmin(
    @Param('numero_cita') numero_cita: number,
    @Body() body: {
      cedula?: string;
      codigo_servicio?: string;
      sede?: string;
      fecha_hora_inicio?: string;
      fecha_hora_fin?: string;
      observaciones?: string;
      estado?: string;
    }
  ) {
    return this.svc.actualizarCitaAdmin(numero_cita, body);
  }

  // Admin: Cancelar cita
  @Put('admin/cancel/:numero_cita')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  cancelarCitaAdmin(
    @Param('numero_cita') numero_cita: number,
    @Body() body?: { motivo?: string }
  ) {
    return this.svc.cancelarCitaAdmin(numero_cita, body?.motivo);
  }
}

// Endpoints de administración de sedes y feriados
@Controller('appointments/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PERSONAL_LAB)
export class AppointmentsAdminController {
  constructor(private readonly svc: AppointmentsService) {}

  @Get('sedes')
  listSedes(){ return this.svc.listSedes(); }

  @Post('sedes')
  upsertSede(@Body() body: { codigo_sede:string; nombre_sede:string; direccion?:string }){ return this.svc.upsertSede(body); }

  @Delete('sedes/:codigo')
  removeSede(@Param('codigo') codigo: string){ return this.svc.removeSede(codigo); }

  @Get('feriados')
  listFeriados(){ return this.svc.listFeriados(); }

  @Post('feriados')
  upsertFeriado(@Body() body: { fecha:string; nombre:string; ambito?:string }){ return this.svc.upsertFeriado(body); }

  @Delete('feriados/:fecha')
  removeFeriado(@Param('fecha') fecha: string){ return this.svc.removeFeriado(fecha); }

  // Configuración de horario semanal
  @Get('schedule')
  getSchedule(){ return this.svc.getSchedule(); }

  @Put('schedule')
  updateSchedule(@Req() req:any, @Body() body: { horario: Record<string, { inicio:string; fin:string }[]> }){
    return this.svc.saveSchedule(req.user.sub, body?.horario || {});
  }
}
