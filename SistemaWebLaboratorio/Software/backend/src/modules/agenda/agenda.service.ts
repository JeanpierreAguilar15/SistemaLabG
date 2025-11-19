import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  CreateSlotDto,
  CreateCitaDto,
  UpdateCitaDto,
  QuerySlotsDto,
} from './dto';

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ==================== SLOTS ====================

  /**
   * Crear un nuevo slot de disponibilidad (Admin)
   */
  async createSlot(data: CreateSlotDto, adminId: number) {
    // Validar que el servicio existe
    const servicio = await this.prisma.servicio.findUnique({
      where: { codigo_servicio: data.codigo_servicio },
    });

    if (!servicio) {
      throw new NotFoundException(
        `Servicio con código ${data.codigo_servicio} no encontrado`,
      );
    }

    // Validar que la sede existe
    const sede = await this.prisma.sede.findUnique({
      where: { codigo_sede: data.codigo_sede },
    });

    if (!sede) {
      throw new NotFoundException(
        `Sede con código ${data.codigo_sede} no encontrada`,
      );
    }

    // Validar que la fecha sea futura
    const fecha = new Date(data.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha < hoy) {
      throw new BadRequestException('No se pueden crear slots en fechas pasadas');
    }

    // Validar que hora_fin > hora_inicio
    if (data.hora_fin <= data.hora_inicio) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio',
      );
    }

    const cuposTotales = data.cupos_totales || 1;

    const slot = await this.prisma.slot.create({
      data: {
        codigo_servicio: data.codigo_servicio,
        codigo_sede: data.codigo_sede,
        fecha: new Date(data.fecha),
        hora_inicio: new Date(`1970-01-01T${data.hora_inicio}:00`),
        hora_fin: new Date(`1970-01-01T${data.hora_fin}:00`),
        cupos_totales: cuposTotales,
        cupos_disponibles: cuposTotales,
        activo: data.activo !== undefined ? data.activo : true,
      },
      include: {
        servicio: true,
        sede: true,
      },
    });

    this.logger.log(
      `Slot creado: ${slot.codigo_slot} | ${data.fecha} ${data.hora_inicio}-${data.hora_fin} | Admin: ${adminId}`,
    );

    // Notificar a todos los pacientes que hay nueva disponibilidad
    this.eventsGateway.notifyCatalogUpdate({
      type: 'slot',
      action: 'created',
      entityId: slot.codigo_slot,
      entityName: `${servicio.nombre} - ${sede.nombre}`,
    });

    return slot;
  }

  /**
   * Obtener slots disponibles (Público/Paciente)
   */
  async getAvailableSlots(filters: QuerySlotsDto) {
    const where: any = {
      activo: true,
    };

    if (filters.codigo_servicio) {
      where.codigo_servicio = filters.codigo_servicio;
    }

    if (filters.codigo_sede) {
      where.codigo_sede = filters.codigo_sede;
    }

    // Filtro de fechas
    if (filters.fecha_desde || filters.fecha_hasta) {
      where.fecha = {};

      if (filters.fecha_desde) {
        where.fecha.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.fecha.lte = new Date(filters.fecha_hasta);
      }
    } else {
      // Por defecto, solo mostrar slots futuros
      where.fecha = {
        gte: new Date(),
      };
    }

    // Solo slots con cupos disponibles
    if (filters.disponibles_solo !== false) {
      where.cupos_disponibles = {
        gt: 0,
      };
    }

    const slots = await this.prisma.slot.findMany({
      where,
      include: {
        servicio: {
          select: {
            codigo_servicio: true,
            nombre: true,
            descripcion: true,
          },
        },
        sede: {
          select: {
            codigo_sede: true,
            nombre: true,
            direccion: true,
            telefono: true,
          },
        },
        _count: {
          select: {
            citas: true,
          },
        },
      },
      orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
    });

    return slots;
  }

  /**
   * Obtener un slot por ID
   */
  async getSlotById(codigo_slot: number) {
    const slot = await this.prisma.slot.findUnique({
      where: { codigo_slot },
      include: {
        servicio: true,
        sede: true,
        citas: {
          include: {
            paciente: {
              select: {
                codigo_usuario: true,
                nombres: true,
                apellidos: true,
                email: true,
                telefono: true,
              },
            },
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException(`Slot con código ${codigo_slot} no encontrado`);
    }

    return slot;
  }

  /**
   * Actualizar slot (Admin)
   */
  async updateSlot(
    codigo_slot: number,
    data: Partial<CreateSlotDto>,
    adminId: number,
  ) {
    const slot = await this.getSlotById(codigo_slot);

    // Si hay citas agendadas, no permitir ciertos cambios
    if (slot.citas.length > 0) {
      if (data.fecha || data.hora_inicio || data.hora_fin) {
        throw new BadRequestException(
          'No se puede cambiar fecha/hora de un slot con citas agendadas. Cancele las citas primero.',
        );
      }
    }

    const updateData: any = {};

    if (data.cupos_totales !== undefined) {
      // Validar que cupos_totales >= citas agendadas
      if (data.cupos_totales < slot.citas.length) {
        throw new BadRequestException(
          `No se puede reducir cupos totales a ${data.cupos_totales}. Ya hay ${slot.citas.length} citas agendadas.`,
        );
      }
      updateData.cupos_totales = data.cupos_totales;
      updateData.cupos_disponibles = data.cupos_totales - slot.citas.length;
    }

    if (data.activo !== undefined) {
      updateData.activo = data.activo;
    }

    const updatedSlot = await this.prisma.slot.update({
      where: { codigo_slot },
      data: updateData,
      include: {
        servicio: true,
        sede: true,
      },
    });

    this.logger.log(
      `Slot actualizado: ${codigo_slot} | Admin: ${adminId}`,
    );

    return updatedSlot;
  }

  /**
   * Eliminar/Desactivar slot (Admin)
   */
  async deleteSlot(codigo_slot: number, adminId: number) {
    const slot = await this.getSlotById(codigo_slot);

    // Si hay citas agendadas, solo desactivar
    if (slot.citas.length > 0) {
      const updated = await this.prisma.slot.update({
        where: { codigo_slot },
        data: { activo: false },
      });

      this.logger.warn(
        `Slot desactivado (con citas): ${codigo_slot} | Admin: ${adminId}`,
      );

      // Notificar a los pacientes con citas
      for (const cita of slot.citas) {
        this.eventsGateway.notifyAppointmentUpdate({
          appointmentId: cita.codigo_cita,
          patientId: cita.codigo_paciente,
          action: 'cancelled',
          appointment: cita,
        });
      }

      return updated;
    }

    // Si no hay citas, eliminar físicamente
    await this.prisma.slot.delete({
      where: { codigo_slot },
    });

    this.logger.log(`Slot eliminado: ${codigo_slot} | Admin: ${adminId}`);

    return { message: 'Slot eliminado exitosamente' };
  }

  // ==================== CITAS ====================

  /**
   * Crear cita (Paciente)
   * Mejoras: Control de concurrencia y validación de conflictos de horario
   */
  async createCita(data: CreateCitaDto, codigo_paciente: number) {
    // Usar transacción para evitar condiciones de carrera (race conditions)
    return await this.prisma.$transaction(async (tx) => {
      // 1. Obtener slot con bloqueo para lectura (evita doble reserva)
      const slot = await tx.slot.findUnique({
        where: { codigo_slot: data.codigo_slot },
        include: {
          servicio: true,
          sede: true,
        },
      });

      if (!slot) {
        throw new NotFoundException(
          `Slot con código ${data.codigo_slot} no encontrado`,
        );
      }

      if (!slot.activo) {
        throw new BadRequestException('Este horario no está activo');
      }

      // 2. Verificar cupos disponibles
      if (slot.cupos_disponibles <= 0) {
        throw new BadRequestException('No hay cupos disponibles en este horario. Por favor seleccione otro horario.');
      }

      // 3. Verificar que el paciente no tenga otra cita en el mismo slot
      const citaEnMismoSlot = await tx.cita.findFirst({
        where: {
          codigo_slot: data.codigo_slot,
          codigo_paciente,
          estado: {
            notIn: ['CANCELADA'],
          },
        },
      });

      if (citaEnMismoSlot) {
        throw new BadRequestException(
          'Ya tiene una cita agendada en este horario',
        );
      }

      // 4. NUEVA VALIDACIÓN: Verificar conflictos de horario con otras citas del paciente
      const citasEnConflicto = await tx.cita.findMany({
        where: {
          codigo_paciente,
          estado: {
            notIn: ['CANCELADA', 'COMPLETADA'],
          },
          slot: {
            fecha: slot.fecha,
            OR: [
              {
                // Cita existente que se solapa con el nuevo slot
                AND: [
                  { hora_inicio: { lt: slot.hora_fin } },
                  { hora_fin: { gt: slot.hora_inicio } },
                ],
              },
            ],
          },
        },
        include: {
          slot: {
            include: {
              servicio: true,
            },
          },
        },
      });

      if (citasEnConflicto.length > 0) {
        const citaConflicto = citasEnConflicto[0];
        const horaInicio = citaConflicto.slot.hora_inicio.toISOString().substring(11, 16);
        const horaFin = citaConflicto.slot.hora_fin.toISOString().substring(11, 16);

        throw new BadRequestException(
          `Ya tiene una cita agendada el mismo día de ${horaInicio} a ${horaFin} (${citaConflicto.slot.servicio.nombre}). ` +
          `Por favor seleccione un horario diferente.`,
        );
      }

      // 5. Crear la cita y actualizar cupos atómicamente
      const cita = await tx.cita.create({
        data: {
          codigo_slot: data.codigo_slot,
          codigo_paciente,
          estado: 'AGENDADA',
          observaciones: data.observaciones,
        },
        include: {
          slot: {
            include: {
              servicio: true,
              sede: true,
            },
          },
          paciente: {
            select: {
              codigo_usuario: true,
              nombres: true,
              apellidos: true,
              email: true,
              telefono: true,
            },
          },
        },
      });

      // 6. Actualizar cupos disponibles
      await tx.slot.update({
        where: { codigo_slot: data.codigo_slot },
        data: {
          cupos_disponibles: {
            decrement: 1,
          },
        },
      });

      this.logger.log(
        `Cita creada: ${cita.codigo_cita} | Paciente: ${codigo_paciente} | Slot: ${data.codigo_slot}`,
      );

      // 7. Notificar cambio en disponibilidad
      this.eventsGateway.notifyCatalogUpdate({
        type: 'slot',
        action: 'updated',
        entityId: slot.codigo_slot,
        entityName: `${slot.servicio.nombre} - Cupos: ${slot.cupos_disponibles - 1}`,
      });

      return cita;
    }, {
      // Configurar timeout e isolation level para evitar deadlocks
      timeout: 10000, // 10 segundos max
      isolationLevel: 'Serializable', // Máximo nivel de aislamiento
    });
  }

  /**
   * Obtener citas del paciente autenticado
   */
  async getMyCitas(codigo_paciente: number) {
    const citas = await this.prisma.cita.findMany({
      where: {
        codigo_paciente,
      },
      include: {
        slot: {
          include: {
            servicio: true,
            sede: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: 'desc',
      },
    });

    return citas;
  }

  /**
   * Obtener todas las citas (Admin)
   */
  async getAllCitas(filters?: {
    codigo_paciente?: number;
    codigo_servicio?: number;
    codigo_sede?: number;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const where: any = {};

    if (filters?.codigo_paciente) {
      where.codigo_paciente = filters.codigo_paciente;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.codigo_servicio || filters?.codigo_sede || filters?.fecha_desde || filters?.fecha_hasta) {
      where.slot = {};

      if (filters.codigo_servicio) {
        where.slot.codigo_servicio = filters.codigo_servicio;
      }

      if (filters.codigo_sede) {
        where.slot.codigo_sede = filters.codigo_sede;
      }

      if (filters.fecha_desde || filters.fecha_hasta) {
        where.slot.fecha = {};

        if (filters.fecha_desde) {
          where.slot.fecha.gte = new Date(filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
          where.slot.fecha.lte = new Date(filters.fecha_hasta);
        }
      }
    }

    const citas = await this.prisma.cita.findMany({
      where,
      include: {
        slot: {
          include: {
            servicio: true,
            sede: true,
          },
        },
        paciente: {
          select: {
            codigo_usuario: true,
            nombres: true,
            apellidos: true,
            cedula: true,
            email: true,
            telefono: true,
          },
        },
      },
      orderBy: [
        { slot: { fecha: 'desc' } },
        { slot: { hora_inicio: 'desc' } },
      ],
    });

    return citas;
  }

  /**
   * Obtener cita por ID
   */
  async getCitaById(codigo_cita: number, codigo_usuario?: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { codigo_cita },
      include: {
        slot: {
          include: {
            servicio: true,
            sede: true,
          },
        },
        paciente: {
          select: {
            codigo_usuario: true,
            nombres: true,
            apellidos: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    if (!cita) {
      throw new NotFoundException(`Cita con código ${codigo_cita} no encontrada`);
    }

    // Si es un paciente, verificar que sea su cita
    if (codigo_usuario && cita.codigo_paciente !== codigo_usuario) {
      throw new NotFoundException('Cita no encontrada');
    }

    return cita;
  }

  /**
   * Actualizar cita (Paciente o Admin)
   */
  async updateCita(
    codigo_cita: number,
    data: UpdateCitaDto,
    codigo_usuario: number,
    isAdmin: boolean = false,
  ) {
    const cita = await this.getCitaById(codigo_cita, isAdmin ? undefined : codigo_usuario);

    const updateData: any = {};

    // Reagendar (cambiar de slot)
    if (data.codigo_slot && data.codigo_slot !== cita.codigo_slot) {
      const nuevoSlot = await this.prisma.slot.findUnique({
        where: { codigo_slot: data.codigo_slot },
      });

      if (!nuevoSlot) {
        throw new NotFoundException('Nuevo slot no encontrado');
      }

      if (!nuevoSlot.activo || nuevoSlot.cupos_disponibles <= 0) {
        throw new BadRequestException('Nuevo slot no disponible');
      }

      // Transacción: liberar cupo del slot anterior y reservar en el nuevo
      const [citaActualizada] = await this.prisma.$transaction([
        this.prisma.cita.update({
          where: { codigo_cita },
          data: {
            codigo_slot: data.codigo_slot,
            estado: 'AGENDADA',
          },
          include: {
            slot: {
              include: {
                servicio: true,
                sede: true,
              },
            },
            paciente: {
              select: {
                codigo_usuario: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        }),
        this.prisma.slot.update({
          where: { codigo_slot: cita.codigo_slot },
          data: {
            cupos_disponibles: { increment: 1 },
          },
        }),
        this.prisma.slot.update({
          where: { codigo_slot: data.codigo_slot },
          data: {
            cupos_disponibles: { decrement: 1 },
          },
        }),
      ]);

      this.logger.log(
        `Cita reagendada: ${codigo_cita} | Usuario: ${codigo_usuario} | Slot anterior: ${cita.codigo_slot} → Nuevo: ${data.codigo_slot}`,
      );

      // Notificar
      this.eventsGateway.notifyAppointmentUpdate({
        appointmentId: codigo_cita,
        patientId: cita.codigo_paciente,
        action: 'updated',
        appointment: citaActualizada,
      });

      return citaActualizada;
    }

    // Actualizar estado
    if (data.estado) {
      updateData.estado = data.estado;

      // Si se confirma, agregar fecha de confirmación
      if (data.estado === 'CONFIRMADA') {
        updateData.confirmada = true;
        updateData.fecha_confirmacion = new Date();
      }

      // Si se cancela, liberar cupo
      if (data.estado === 'CANCELADA') {
        updateData.motivo_cancelacion = data.motivo_cancelacion;

        await this.prisma.slot.update({
          where: { codigo_slot: cita.codigo_slot },
          data: {
            cupos_disponibles: { increment: 1 },
          },
        });
      }
    }

    if (data.observaciones !== undefined) {
      updateData.observaciones = data.observaciones;
    }

    const citaActualizada = await this.prisma.cita.update({
      where: { codigo_cita },
      data: updateData,
      include: {
        slot: {
          include: {
            servicio: true,
            sede: true,
          },
        },
        paciente: {
          select: {
            codigo_usuario: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    this.logger.log(
      `Cita actualizada: ${codigo_cita} | Estado: ${data.estado} | Usuario: ${codigo_usuario}`,
    );

    // Notificar
    const action = data.estado === 'CANCELADA' ? 'cancelled' :
                   data.estado === 'CONFIRMADA' ? 'confirmed' : 'updated';

    this.eventsGateway.notifyAppointmentUpdate({
      appointmentId: codigo_cita,
      patientId: cita.codigo_paciente,
      action,
      appointment: citaActualizada,
    });

    return citaActualizada;
  }

  /**
   * Cancelar cita (Paciente)
   */
  async cancelarCita(
    codigo_cita: number,
    motivo_cancelacion: string,
    codigo_paciente: number,
  ) {
    return this.updateCita(
      codigo_cita,
      {
        estado: 'CANCELADA',
        motivo_cancelacion,
      },
      codigo_paciente,
      false,
    );
  }

  /**
   * Confirmar cita (Admin)
   */
  async confirmarCita(codigo_cita: number, adminId: number) {
    return this.updateCita(
      codigo_cita,
      { estado: 'CONFIRMADA' },
      adminId,
      true,
    );
  }

  /**
   * Obtener estadísticas de citas (Admin)
   */
  async getEstadisticas(filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const where: any = {};

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.slot = {
        fecha: {},
      };

      if (filters.fecha_desde) {
        where.slot.fecha.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.slot.fecha.lte = new Date(filters.fecha_hasta);
      }
    }

    const [
      totalCitas,
      citasAgendadas,
      citasConfirmadas,
      citasCanceladas,
      citasCompletadas,
      citasNoAsistio,
    ] = await Promise.all([
      this.prisma.cita.count({ where }),
      this.prisma.cita.count({ where: { ...where, estado: 'AGENDADA' } }),
      this.prisma.cita.count({ where: { ...where, estado: 'CONFIRMADA' } }),
      this.prisma.cita.count({ where: { ...where, estado: 'CANCELADA' } }),
      this.prisma.cita.count({ where: { ...where, estado: 'COMPLETADA' } }),
      this.prisma.cita.count({ where: { ...where, estado: 'NO_ASISTIO' } }),
    ]);

    return {
      total: totalCitas,
      agendadas: citasAgendadas,
      confirmadas: citasConfirmadas,
      canceladas: citasCanceladas,
      completadas: citasCompletadas,
      no_asistio: citasNoAsistio,
      tasa_asistencia: totalCitas > 0
        ? ((citasCompletadas / (totalCitas - citasCanceladas)) * 100).toFixed(2)
        : '0.00',
    };
  }
}
