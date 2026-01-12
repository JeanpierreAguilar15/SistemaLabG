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
}
