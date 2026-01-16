import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TipoCancha } from '@prisma/client';

@Injectable()
export class CanchasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tipo?: string, includeInactive = false) {
    const where: any = {};

    if (tipo) {
      where.tipo = tipo.toUpperCase() as TipoCancha;
    }

    if (!includeInactive) {
      where.activa = true;
    }

    return this.prisma.cancha.findMany({
      where,
      include: {
        horarios: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: string) {
    const cancha = await this.prisma.cancha.findUnique({
      where: { id },
      include: { horarios: true },
    });

    if (!cancha) {
      throw new NotFoundException('Cancha no encontrada');
    }

    return cancha;
  }

  async getDisponibilidad(canchaId: string, fecha: string) {
    const cancha = await this.findById(canchaId);
    const fechaDate = new Date(fecha);
    const diaSemana = fechaDate.getDay();

    // Obtener horario del día
    const horarioDia = cancha.horarios.find(h => h.diaSemana === diaSemana);
    if (!horarioDia || !horarioDia.disponible) {
      return { disponible: false, mensaje: 'Cancha no disponible este día', slots: [] };
    }

    // Obtener reservas del día
    const reservas = await this.prisma.reserva.findMany({
      where: {
        canchaId,
        fecha: fechaDate,
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
    });

    // Generar slots disponibles
    const slots = this.generarSlots(horarioDia.horaInicio, horarioDia.horaFin, reservas);

    return {
      disponible: true,
      fecha,
      cancha: cancha.nombre,
      horario: `${horarioDia.horaInicio} - ${horarioDia.horaFin}`,
      slots,
    };
  }

  private generarSlots(horaInicio: string, horaFin: string, reservas: any[]) {
    const slots = [];
    const [startH] = horaInicio.split(':').map(Number);
    const [endH] = horaFin.split(':').map(Number);

    for (let hora = startH; hora < endH; hora++) {
      const horaStr = `${hora.toString().padStart(2, '0')}:00`;
      const horaFinStr = `${(hora + 1).toString().padStart(2, '0')}:00`;
      const reservado = reservas.some(r => r.horaInicio === horaStr);

      slots.push({
        horaInicio: horaStr,
        horaFin: horaFinStr,
        disponible: !reservado,
      });
    }

    return slots;
  }

  async create(data: any) {
    return this.prisma.cancha.create({
      data,
      include: { horarios: true }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.cancha.update({
      where: { id },
      data,
      include: { horarios: true }
    });
  }

  async delete(id: string) {
    // Soft delete - just mark as inactive
    return this.prisma.cancha.update({
      where: { id },
      data: { activa: false }
    });
  }

  async getHorarios(id: string) {
    const cancha = await this.findById(id);
    return cancha.horarios;
  }

  async updateHorarios(id: string, horarios: any[]) {
    // Delete existing horarios and create new ones
    await this.prisma.horarioCancha.deleteMany({
      where: { canchaId: id }
    });

    // Create new horarios
    await this.prisma.horarioCancha.createMany({
      data: horarios.map(h => ({
        canchaId: id,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        disponible: h.disponible ?? true
      }))
    });

    return this.getHorarios(id);
  }
}
