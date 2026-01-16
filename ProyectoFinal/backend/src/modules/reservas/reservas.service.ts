import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CanchasService } from '@modules/canchas/canchas.service';

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canchasService: CanchasService,
  ) {}

  async create(usuarioId: string, data: any) {
    // Verificar disponibilidad
    const disponibilidad = await this.canchasService.getDisponibilidad(
      data.canchaId,
      data.fecha,
    );

    const slotDisponible = disponibilidad.slots?.find(
      (s: any) => s.horaInicio === data.horaInicio && s.disponible,
    );

    if (!slotDisponible) {
      throw new BadRequestException('El horario seleccionado no está disponible');
    }

    // Obtener precio de la cancha
    const cancha = await this.canchasService.findById(data.canchaId);

    const reserva = await this.prisma.reserva.create({
      data: {
        usuarioId,
        canchaId: data.canchaId,
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        notas: data.notas,
        estado: 'PENDIENTE',
      },
      include: {
        cancha: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return {
      message: 'Reserva creada exitosamente',
      reserva,
      montoPagar: cancha.precioPorHora,
    };
  }

  async findByUsuario(usuarioId: string) {
    return this.prisma.reserva.findMany({
      where: { usuarioId },
      include: {
        cancha: true,
        pago: true,
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findById(id: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        cancha: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        pago: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return reserva;
  }

  async cancelar(id: string, usuarioId: string) {
    const reserva = await this.findById(id);

    if (reserva.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
    }

    if (reserva.estado === 'CANCELADA') {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    if (reserva.estado === 'COMPLETADA') {
      throw new BadRequestException('No se puede cancelar una reserva completada');
    }

    return this.prisma.reserva.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    });
  }

  // Admin methods
  async findAll(estado?: string, fecha?: string) {
    const where: any = {};
    if (estado) where.estado = estado;
    if (fecha) where.fecha = new Date(fecha);

    return this.prisma.reserva.findMany({
      where,
      include: {
        cancha: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        pago: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Reservas de hoy
    const reservasHoy = await this.prisma.reserva.count({
      where: {
        fecha: {
          gte: today,
          lt: tomorrow,
        },
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
    });

    // Total reservas
    const totalReservas = await this.prisma.reserva.count();

    // Ingresos del mes (pagos completados)
    const pagosDelMes = await this.prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        estado: 'COMPLETADO',
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Usuarios activos (con al menos una reserva)
    const usuariosActivos = await this.prisma.usuario.count({
      where: {
        reservas: { some: {} },
      },
    });

    // Reservas recientes
    const reservasRecientes = await this.prisma.reserva.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        cancha: { select: { nombre: true } },
        usuario: { select: { nombre: true, apellido: true } },
      },
    });

    return {
      reservasHoy,
      totalReservas,
      ingresosMes: pagosDelMes._sum.monto || 0,
      usuariosActivos,
      reservasRecientes,
    };
  }

  async confirmar(id: string) {
    const reserva = await this.findById(id);

    if (reserva.estado !== 'PENDIENTE') {
      throw new BadRequestException('Solo se pueden confirmar reservas pendientes');
    }

    return this.prisma.reserva.update({
      where: { id },
      data: { estado: 'CONFIRMADA' },
      include: {
        cancha: true,
        usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
    });
  }

  async cancelarAdmin(id: string) {
    return this.prisma.reserva.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    });
  }
}
