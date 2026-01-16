import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CanchasService } from '@modules/canchas/canchas.service';
import { ConfiguracionService } from '@modules/configuracion/configuracion.service';

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canchasService: CanchasService,
    private readonly configuracionService: ConfiguracionService,
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

    try {
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
    } catch (error: any) {
      // Handle unique constraint violation (race condition)
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Este horario acaba de ser reservado por otro usuario. Por favor selecciona otro horario.',
        );
      }
      throw error;
    }
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

  async cancelar(id: string, usuarioId: string, forzar = false) {
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

    // Check cancellation policy
    const minHoras = this.configuracionService.getCancelacionMinHoras();
    const fechaReserva = new Date(reserva.fecha);
    const [horas, minutos] = reserva.horaInicio.split(':').map(Number);
    fechaReserva.setHours(horas, minutos, 0, 0);

    const ahora = new Date();
    const horasHastaReserva = (fechaReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (horasHastaReserva < minHoras && !forzar) {
      throw new BadRequestException(
        `No se puede cancelar con menos de ${minHoras} horas de anticipacion. ` +
        `La reserva es en ${Math.max(0, Math.floor(horasHastaReserva))} horas.`
      );
    }

    const canceladaTarde = horasHastaReserva < minHoras;

    await this.prisma.reserva.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    });

    return {
      message: 'Reserva cancelada exitosamente',
      canceladaTarde,
      horasAnticipacion: Math.max(0, Math.floor(horasHastaReserva)),
    };
  }

  async verificarPoliticaCancelacion(id: string) {
    const reserva = await this.findById(id);
    const minHoras = this.configuracionService.getCancelacionMinHoras();

    const fechaReserva = new Date(reserva.fecha);
    const [horas, minutos] = reserva.horaInicio.split(':').map(Number);
    fechaReserva.setHours(horas, minutos, 0, 0);

    const ahora = new Date();
    const horasHastaReserva = (fechaReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    const puedeCancelar = horasHastaReserva >= minHoras;

    return {
      puedeCancelar,
      horasHastaReserva: Math.max(0, Math.floor(horasHastaReserva)),
      horasMinimas: minHoras,
      mensaje: puedeCancelar
        ? `Puedes cancelar esta reserva sin penalidad (faltan ${Math.floor(horasHastaReserva)} horas)`
        : `La reserva es en menos de ${minHoras} horas. La cancelacion tardía podría tener penalidad.`,
    };
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

  async getReportes(fechaInicio?: string, fechaFin?: string) {
    // Parse dates in local timezone to avoid issues
    const now = new Date();
    let inicio: Date;
    let fin: Date;

    if (fechaInicio) {
      const [year, month, day] = fechaInicio.split('-').map(Number);
      inicio = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      inicio = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0, 0);
    }

    if (fechaFin) {
      const [year, month, day] = fechaFin.split('-').map(Number);
      fin = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      fin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    // Reservas por cancha (usando createdAt para mostrar reservas CREADAS en el periodo)
    const reservasPorCancha = await this.prisma.reserva.groupBy({
      by: ['canchaId'],
      _count: { id: true },
      where: {
        createdAt: { gte: inicio, lte: fin },
      },
    });

    const canchas = await this.prisma.cancha.findMany({
      select: { id: true, nombre: true, tipo: true },
    });

    const reservasPorCanchaConNombre = reservasPorCancha.map((r) => {
      const cancha = canchas.find((c) => c.id === r.canchaId);
      return {
        canchaId: r.canchaId,
        nombre: cancha?.nombre || 'Desconocida',
        tipo: cancha?.tipo || 'OTRO',
        cantidad: r._count.id,
      };
    });

    // Reservas por estado
    const reservasPorEstado = await this.prisma.reserva.groupBy({
      by: ['estado'],
      _count: { id: true },
      where: {
        createdAt: { gte: inicio, lte: fin },
      },
    });

    // Ingresos por metodo de pago
    const ingresosPorMetodo = await this.prisma.pago.groupBy({
      by: ['metodo'],
      _sum: { monto: true },
      _count: { id: true },
      where: {
        estado: 'COMPLETADO',
        createdAt: { gte: inicio, lte: fin },
      },
    });

    // Ingresos diarios del periodo
    const pagos = await this.prisma.pago.findMany({
      where: {
        estado: 'COMPLETADO',
        createdAt: { gte: inicio, lte: fin },
      },
      select: {
        monto: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const ingresosDiarios = pagos.reduce((acc: any[], pago) => {
      const fecha = pago.createdAt.toISOString().split('T')[0];
      const existing = acc.find((i) => i.fecha === fecha);
      if (existing) {
        existing.monto += Number(pago.monto);
      } else {
        acc.push({ fecha, monto: Number(pago.monto) });
      }
      return acc;
    }, []);

    // Top clientes
    const topClientes = await this.prisma.reserva.groupBy({
      by: ['usuarioId'],
      _count: { id: true },
      where: {
        createdAt: { gte: inicio, lte: fin },
        estado: { in: ['CONFIRMADA', 'COMPLETADA'] },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: topClientes.map((c) => c.usuarioId) } },
      select: { id: true, nombre: true, apellido: true },
    });

    const topClientesConNombre = topClientes.map((c) => {
      const usuario = usuarios.find((u) => u.id === c.usuarioId);
      return {
        nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido',
        reservas: c._count.id,
      };
    });

    // Totales
    const totalReservas = await this.prisma.reserva.count({
      where: { createdAt: { gte: inicio, lte: fin } },
    });

    const totalIngresos = await this.prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        estado: 'COMPLETADO',
        createdAt: { gte: inicio, lte: fin },
      },
    });

    const totalCanceladas = await this.prisma.reserva.count({
      where: {
        createdAt: { gte: inicio, lte: fin },
        estado: 'CANCELADA',
      },
    });

    return {
      periodo: {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0],
      },
      resumen: {
        totalReservas,
        totalIngresos: Number(totalIngresos._sum.monto) || 0,
        totalCanceladas,
        tasaCancelacion: totalReservas > 0 ? ((totalCanceladas / totalReservas) * 100).toFixed(1) : 0,
      },
      reservasPorCancha: reservasPorCanchaConNombre,
      reservasPorEstado: reservasPorEstado.map((r) => ({
        estado: r.estado,
        cantidad: r._count.id,
      })),
      ingresosPorMetodo: ingresosPorMetodo.map((i) => ({
        metodo: i.metodo,
        total: Number(i._sum.monto) || 0,
        cantidad: i._count.id,
      })),
      ingresosDiarios,
      topClientes: topClientesConNombre,
    };
  }
}
