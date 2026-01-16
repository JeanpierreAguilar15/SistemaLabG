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
    // Verificar que la reserva existe y pertenece al usuario
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

    // Crear el pago
    const pago = await this.prisma.pago.create({
      data: {
        reservaId: data.reservaId,
        usuarioId,
        monto: reserva.cancha.precioPorHora,
        metodo: data.metodo as MetodoPago,
        estado: 'COMPLETADO',
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

    // Actualizar estado de la reserva a CONFIRMADA
    await this.prisma.reserva.update({
      where: { id: data.reservaId },
      data: { estado: 'CONFIRMADA' },
    });

    // Enviar email de confirmacion
    const metodosNombre: Record<string, string> = {
      EFECTIVO: 'Efectivo',
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
        monto: pago.monto,
        metodo: metodosNombre[data.metodo] || data.metodo,
        referencia: pago.referencia,
      },
    );

    return {
      message: 'Pago procesado exitosamente',
      pago,
      comprobante: {
        referencia: pago.referencia,
        monto: pago.monto,
        fecha: pago.createdAt,
        cancha: reserva.cancha.nombre,
        fechaReserva: reserva.fecha,
        horario: `${reserva.horaInicio} - ${reserva.horaFin}`,
      },
    };
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

  private generarReferencia(): string {
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAG-${fecha}-${random}`;
  }
}
