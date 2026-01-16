import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReservasService } from '@modules/reservas/reservas.service';
import { NotificacionesService } from '@modules/notificaciones/notificaciones.service';
import { MetodoPago } from '@prisma/client';

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservasService: ReservasService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async procesarPago(usuarioId: string, data: any) {
    const reserva = await this.reservasService.findById(data.reservaId);

    if (reserva.usuarioId !== usuarioId) {
      throw new BadRequestException('No tienes permiso para pagar esta reserva');
    }

    if (reserva.pago) {
      throw new BadRequestException('Esta reserva ya tiene un pago asociado');
    }

    if (reserva.estado === 'CANCELADA') {
      throw new BadRequestException('No se puede pagar una reserva cancelada');
    }

    const esPresencial = data.metodo === 'EFECTIVO';
    const estadoPago = esPresencial ? 'PENDIENTE' : 'COMPLETADO';

    const pago = await this.prisma.pago.create({
      data: {
        reservaId: data.reservaId,
        usuarioId,
        monto: reserva.cancha.precioPorHora,
        metodo: data.metodo as MetodoPago,
        estado: estadoPago,
        referencia: this.generarReferencia(),
      },
      include: {
        reserva: {
          include: { cancha: true },
        },
        usuario: {
          select: { email: true, nombre: true, apellido: true },
        },
      },
    });

    // Solo confirmar reserva si el pago es completado (tarjeta)
    if (!esPresencial) {
      await this.prisma.reserva.update({
        where: { id: data.reservaId },
        data: { estado: 'CONFIRMADA' },
      });

      // Enviar email de confirmacion solo para pagos completados
      await this.enviarEmailConfirmacion(pago, reserva, data.metodo);
    } else {
      // Para pago presencial, enviar email de reserva pendiente
      await this.notificacionesService.enviarConfirmacionReserva(
        pago.usuario.email,
        {
          nombre: `${pago.usuario.nombre} ${pago.usuario.apellido}`,
          cancha: reserva.cancha.nombre,
          fecha: new Date(reserva.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          horaInicio: reserva.horaInicio,
          horaFin: reserva.horaFin,
          monto: Number(reserva.cancha.precioPorHora),
        },
      );
    }

    return {
      message: esPresencial
        ? 'Reserva registrada. Recuerda pagar al llegar al local.'
        : 'Pago procesado exitosamente',
      pago,
      comprobante: {
        referencia: pago.referencia,
        monto: pago.monto,
        fecha: pago.createdAt,
        cancha: reserva.cancha.nombre,
        fechaReserva: reserva.fecha,
        horario: `${reserva.horaInicio} - ${reserva.horaFin}`,
        estadoPago: estadoPago,
      },
    };
  }

  // Admin: Aprobar pago presencial
  async aprobarPago(pagoId: string) {
    const pago = await this.findById(pagoId);

    if (pago.estado === 'COMPLETADO') {
      throw new BadRequestException('Este pago ya esta completado');
    }

    const pagoActualizado = await this.prisma.pago.update({
      where: { id: pagoId },
      data: { estado: 'COMPLETADO' },
      include: {
        reserva: { include: { cancha: true } },
        usuario: { select: { email: true, nombre: true, apellido: true } },
      },
    });

    // Confirmar la reserva
    await this.prisma.reserva.update({
      where: { id: pago.reservaId },
      data: { estado: 'CONFIRMADA' },
    });

    // Enviar email de confirmacion
    await this.enviarEmailConfirmacion(pagoActualizado, pago.reserva, pago.metodo);

    return {
      message: 'Pago aprobado exitosamente',
      pago: pagoActualizado,
    };
  }

  // Admin: Rechazar pago
  async rechazarPago(pagoId: string, motivo?: string) {
    const pago = await this.findById(pagoId);

    if (pago.estado === 'COMPLETADO') {
      throw new BadRequestException('No se puede rechazar un pago completado');
    }

    await this.prisma.pago.update({
      where: { id: pagoId },
      data: { estado: 'RECHAZADO' },
    });

    // Cancelar la reserva
    await this.prisma.reserva.update({
      where: { id: pago.reservaId },
      data: { estado: 'CANCELADA' },
    });

    return { message: 'Pago rechazado y reserva cancelada' };
  }

  // Admin: Obtener todos los pagos
  async findAll(estado?: string) {
    const where: any = {};
    if (estado) where.estado = estado;

    return this.prisma.pago.findMany({
      where,
      include: {
        reserva: { include: { cancha: true } },
        usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUsuario(usuarioId: string) {
    return this.prisma.pago.findMany({
      where: { usuarioId },
      include: {
        reserva: {
          include: { cancha: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: {
        reserva: {
          include: { cancha: true },
        },
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }

  private async enviarEmailConfirmacion(pago: any, reserva: any, metodo: string) {
    const metodosNombre: Record<string, string> = {
      EFECTIVO: 'Efectivo (Presencial)',
      TARJETA: 'Tarjeta de Credito/Debito',
      TRANSFERENCIA: 'Transferencia Bancaria',
      QR: 'Pago QR',
    };

    await this.notificacionesService.enviarConfirmacionPago(
      pago.usuario.email,
      {
        nombre: `${pago.usuario.nombre} ${pago.usuario.apellido}`,
        cancha: reserva.cancha.nombre,
        fecha: new Date(reserva.fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        monto: Number(pago.monto),
        metodo: metodosNombre[metodo] || metodo,
        referencia: pago.referencia || '',
      },
    );
  }

  private generarReferencia(): string {
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAG-${fecha}-${random}`;
  }
}
