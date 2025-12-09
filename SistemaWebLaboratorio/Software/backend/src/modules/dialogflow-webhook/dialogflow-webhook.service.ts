import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DialogflowResponseDto,
  PrecioExamenDto,
  RangoReferenciaDto,
  DisponibilidadDto,
  HorarioDisponibleDto,
  CitaInfoDto,
  AgendarCitaDto,
} from './dto/dialogflow.dto';

@Injectable()
export class DialogflowWebhookService {
  private readonly logger = new Logger(DialogflowWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta el precio de un examen por nombre
   */
  async consultarPrecioExamen(nombre: string): Promise<DialogflowResponseDto<PrecioExamenDto>> {
    this.logger.log(`Consultando precio para: ${nombre}`);

    try {
      const examen = await this.prisma.examen.findFirst({
        where: {
          OR: [
            { nombre: { contains: nombre, mode: 'insensitive' } },
            { codigo_interno: { contains: nombre, mode: 'insensitive' } },
          ],
          activo: true,
        },
        include: {
          categoria: true,
          precios: {
            where: { activo: true },
            orderBy: { fecha_inicio: 'desc' },
            take: 1,
          },
        },
      });

      if (!examen) {
        return {
          success: false,
          mensaje: `No encontramos el examen "${nombre}" en nuestro catálogo. Por favor verifica el nombre o consulta nuestros servicios disponibles.`,
          error_code: 'EXAMEN_NO_ENCONTRADO',
        };
      }

      const precioActual = examen.precios[0]?.precio;
      if (!precioActual) {
        return {
          success: true,
          data: {
            nombre: examen.nombre,
            precio: 0,
            moneda: 'USD',
            categoria: examen.categoria?.nombre,
            requiere_ayuno: examen.requiere_ayuno,
            horas_ayuno: examen.horas_ayuno || undefined,
          },
          mensaje: `El examen ${examen.nombre} no tiene precio registrado actualmente. Por favor contacta a nuestras sedes para más información.`,
        };
      }

      const precio = Number(precioActual);
      let preparacion = '';
      if (examen.requiere_ayuno) {
        preparacion = ` Requiere ayuno de ${examen.horas_ayuno || 8} horas.`;
      }

      return {
        success: true,
        data: {
          nombre: examen.nombre,
          precio: precio,
          moneda: 'USD',
          categoria: examen.categoria?.nombre,
          requiere_ayuno: examen.requiere_ayuno,
          horas_ayuno: examen.horas_ayuno || undefined,
        },
        mensaje: `El ${examen.nombre} tiene un costo de $${precio.toFixed(2)} USD.${preparacion}`,
      };
    } catch (error) {
      this.logger.error('Error consultando precio', error);
      return {
        success: false,
        mensaje: 'Ocurrió un error al consultar el precio. Por favor intenta de nuevo.',
        error_code: 'ERROR_INTERNO',
      };
    }
  }

  /**
   * Consulta los valores de referencia/rangos normales de un examen
   */
  async consultarRangoExamen(nombre: string): Promise<DialogflowResponseDto<RangoReferenciaDto>> {
    this.logger.log(`Consultando rango de referencia para: ${nombre}`);

    try {
      const examen = await this.prisma.examen.findFirst({
        where: {
          OR: [
            { nombre: { contains: nombre, mode: 'insensitive' } },
            { codigo_interno: { contains: nombre, mode: 'insensitive' } },
          ],
          activo: true,
        },
        select: {
          nombre: true,
          valor_referencia_min: true,
          valor_referencia_max: true,
          unidad_medida: true,
          valores_referencia_texto: true,
        },
      });

      if (!examen) {
        return {
          success: false,
          mensaje: `No encontramos el examen "${nombre}" en nuestro catálogo.`,
          error_code: 'EXAMEN_NO_ENCONTRADO',
        };
      }

      const valorMin = examen.valor_referencia_min ? Number(examen.valor_referencia_min) : undefined;
      const valorMax = examen.valor_referencia_max ? Number(examen.valor_referencia_max) : undefined;
      const unidad = examen.unidad_medida || '';

      let mensaje = `Valores de referencia para ${examen.nombre}: `;

      if (valorMin !== undefined && valorMax !== undefined) {
        mensaje += `${valorMin} - ${valorMax} ${unidad}.`;
      } else if (examen.valores_referencia_texto) {
        mensaje += examen.valores_referencia_texto;
      } else {
        mensaje = `El examen ${examen.nombre} no tiene valores de referencia numéricos definidos. Consulta con un profesional para interpretación.`;
      }

      return {
        success: true,
        data: {
          nombre: examen.nombre,
          valor_min: valorMin,
          valor_max: valorMax,
          unidad_medida: examen.unidad_medida || undefined,
          valores_texto: examen.valores_referencia_texto || undefined,
        },
        mensaje,
      };
    } catch (error) {
      this.logger.error('Error consultando rango', error);
      return {
        success: false,
        mensaje: 'Ocurrió un error al consultar los valores de referencia.',
        error_code: 'ERROR_INTERNO',
      };
    }
  }

  /**
   * Consulta disponibilidad de horarios para una fecha
   */
  async consultarDisponibilidad(fecha: string, codigoServicio?: number): Promise<DialogflowResponseDto<DisponibilidadDto>> {
    this.logger.log(`Consultando disponibilidad para: ${fecha}`);

    try {
      const fechaConsulta = new Date(fecha);
      if (isNaN(fechaConsulta.getTime())) {
        return {
          success: false,
          mensaje: 'La fecha proporcionada no es válida. Usa el formato YYYY-MM-DD.',
          error_code: 'FECHA_INVALIDA',
        };
      }

      // Verificar que la fecha no sea pasada
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fechaConsulta < hoy) {
        return {
          success: false,
          mensaje: 'No es posible consultar disponibilidad para fechas pasadas.',
          error_code: 'FECHA_PASADA',
        };
      }

      // Verificar si es feriado
      const feriado = await this.prisma.feriado.findFirst({
        where: {
          fecha: fechaConsulta,
          activo: true,
        },
      });

      if (feriado) {
        return {
          success: true,
          data: {
            fecha,
            total_horarios: 0,
            horarios: [],
          },
          mensaje: `El ${fecha} es ${feriado.descripcion} y no hay atención. Por favor selecciona otra fecha.`,
        };
      }

      // Buscar slots disponibles
      const whereClause: any = {
        fecha: fechaConsulta,
        activo: true,
        cupos_disponibles: { gt: 0 },
      };

      if (codigoServicio) {
        whereClause.codigo_servicio = codigoServicio;
      }

      const slots = await this.prisma.slot.findMany({
        where: whereClause,
        include: {
          sede: true,
          servicio: true,
        },
        orderBy: [
          { hora_inicio: 'asc' },
        ],
      });

      if (slots.length === 0) {
        return {
          success: true,
          data: {
            fecha,
            total_horarios: 0,
            horarios: [],
          },
          mensaje: `No hay horarios disponibles para el ${fecha}. Te recomendamos consultar otra fecha.`,
        };
      }

      const horarios: HorarioDisponibleDto[] = slots.map(slot => ({
        slot_id: slot.codigo_slot,
        hora: new Date(slot.hora_inicio).toLocaleTimeString('es', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        cupos: slot.cupos_disponibles,
        sede: slot.sede?.nombre || 'Sede Principal',
        servicio: slot.servicio?.nombre || 'Servicio General',
      }));

      const fechaFormateada = fechaConsulta.toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      return {
        success: true,
        data: {
          fecha,
          total_horarios: horarios.length,
          horarios,
        },
        mensaje: `Para el ${fechaFormateada} tenemos ${horarios.length} horarios disponibles. El primero es a las ${horarios[0].hora} en ${horarios[0].sede}.`,
      };
    } catch (error) {
      this.logger.error('Error consultando disponibilidad', error);
      return {
        success: false,
        mensaje: 'Ocurrió un error al consultar la disponibilidad.',
        error_code: 'ERROR_INTERNO',
      };
    }
  }

  /**
   * Agenda una nueva cita
   */
  async agendarCita(dto: AgendarCitaDto): Promise<DialogflowResponseDto<CitaInfoDto>> {
    this.logger.log(`Agendando cita para: ${dto.cedula_paciente} - ${dto.fecha} ${dto.hora}`);

    try {
      // 1. Buscar paciente por cédula
      const paciente = await this.prisma.usuario.findFirst({
        where: {
          cedula: dto.cedula_paciente,
          activo: true,
        },
      });

      if (!paciente) {
        return {
          success: false,
          mensaje: `No encontramos un paciente registrado con la cédula ${dto.cedula_paciente}. Por favor regístrate primero en nuestro portal o acude a una de nuestras sedes.`,
          error_code: 'PACIENTE_NO_ENCONTRADO',
        };
      }

      // 2. Parsear fecha y hora
      const fechaCita = new Date(dto.fecha);
      if (isNaN(fechaCita.getTime())) {
        return {
          success: false,
          mensaje: 'La fecha proporcionada no es válida.',
          error_code: 'FECHA_INVALIDA',
        };
      }

      // 3. Buscar slot disponible que coincida
      const [horas, minutos] = dto.hora.split(':').map(Number);
      const horaInicioBuscada = new Date(1970, 0, 1, horas, minutos, 0);

      // Buscar slots para esa fecha y hora aproximada
      const slots = await this.prisma.slot.findMany({
        where: {
          fecha: fechaCita,
          activo: true,
          cupos_disponibles: { gt: 0 },
          ...(dto.codigo_servicio && { codigo_servicio: dto.codigo_servicio }),
          ...(dto.codigo_sede && { codigo_sede: dto.codigo_sede }),
        },
        include: {
          sede: true,
          servicio: true,
        },
        orderBy: { hora_inicio: 'asc' },
      });

      // Filtrar por hora exacta o más cercana
      let slotSeleccionado = slots.find(slot => {
        const slotHora = new Date(slot.hora_inicio);
        return slotHora.getHours() === horas && slotHora.getMinutes() === minutos;
      });

      // Si no hay slot exacto, tomar el primero disponible cercano
      if (!slotSeleccionado && slots.length > 0) {
        slotSeleccionado = slots[0];
      }

      if (!slotSeleccionado) {
        return {
          success: false,
          mensaje: `No hay horarios disponibles para el ${dto.fecha} a las ${dto.hora}. Por favor consulta disponibilidad para otra fecha u hora.`,
          error_code: 'SLOT_NO_DISPONIBLE',
        };
      }

      // 4. Verificar que el paciente no tenga ya cita en ese slot
      const citaExistente = await this.prisma.cita.findFirst({
        where: {
          codigo_paciente: paciente.codigo_usuario,
          codigo_slot: slotSeleccionado.codigo_slot,
          estado: { notIn: ['CANCELADA'] },
        },
      });

      if (citaExistente) {
        return {
          success: false,
          mensaje: 'Ya tienes una cita agendada en este horario.',
          error_code: 'CITA_DUPLICADA',
        };
      }

      // 5. Crear cita en transacción
      const cita = await this.prisma.$transaction(async (prisma) => {
        // Decrementar cupos
        await prisma.slot.update({
          where: { codigo_slot: slotSeleccionado!.codigo_slot },
          data: { cupos_disponibles: { decrement: 1 } },
        });

        // Crear cita
        return prisma.cita.create({
          data: {
            codigo_paciente: paciente.codigo_usuario,
            codigo_slot: slotSeleccionado!.codigo_slot,
            estado: 'AGENDADA',
            observaciones: dto.observaciones || 'Cita agendada vía Dialogflow',
          },
          include: {
            slot: {
              include: {
                servicio: true,
                sede: true,
              },
            },
          },
        });
      });

      const horaFormateada = new Date(slotSeleccionado.hora_inicio).toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const fechaFormateada = fechaCita.toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      this.logger.log(`Cita ${cita.codigo_cita} creada vía Dialogflow para paciente ${paciente.codigo_usuario}`);

      return {
        success: true,
        data: {
          codigo_cita: cita.codigo_cita,
          fecha: dto.fecha,
          hora: horaFormateada,
          servicio: slotSeleccionado.servicio?.nombre || 'Servicio General',
          sede: slotSeleccionado.sede?.nombre || 'Sede Principal',
          estado: 'AGENDADA',
        },
        mensaje: `Tu cita ha sido agendada exitosamente. Código de cita: #${cita.codigo_cita}. Te esperamos el ${fechaFormateada} a las ${horaFormateada} en ${slotSeleccionado.sede?.nombre || 'nuestra sede'}. Recuerda llegar 15 minutos antes.`,
      };
    } catch (error) {
      this.logger.error('Error agendando cita', error);
      return {
        success: false,
        mensaje: 'Ocurrió un error al agendar la cita. Por favor intenta de nuevo o contacta a nuestras sedes.',
        error_code: 'ERROR_INTERNO',
      };
    }
  }

  /**
   * Consulta las citas de un paciente por cédula
   */
  async consultarCitasPaciente(cedula: string): Promise<DialogflowResponseDto<CitaInfoDto[]>> {
    this.logger.log(`Consultando citas para paciente: ${cedula}`);

    try {
      // Buscar paciente
      const paciente = await this.prisma.usuario.findFirst({
        where: {
          cedula: cedula,
          activo: true,
        },
      });

      if (!paciente) {
        return {
          success: false,
          mensaje: `No encontramos un paciente registrado con la cédula ${cedula}.`,
          error_code: 'PACIENTE_NO_ENCONTRADO',
        };
      }

      // Buscar citas pendientes
      const citas = await this.prisma.cita.findMany({
        where: {
          codigo_paciente: paciente.codigo_usuario,
          estado: { in: ['AGENDADA', 'CONFIRMADA', 'EN_PROCESO'] },
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
          slot: { fecha: 'asc' },
        },
        take: 10,
      });

      if (citas.length === 0) {
        return {
          success: true,
          data: [],
          mensaje: 'No tienes citas pendientes. ¿Deseas agendar una nueva cita?',
        };
      }

      const citasInfo: CitaInfoDto[] = citas.map(cita => ({
        codigo_cita: cita.codigo_cita,
        fecha: new Date(cita.slot.fecha).toISOString().split('T')[0],
        hora: new Date(cita.slot.hora_inicio).toLocaleTimeString('es', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        servicio: cita.slot.servicio?.nombre || 'Servicio General',
        sede: cita.slot.sede?.nombre || 'Sede Principal',
        estado: cita.estado,
      }));

      const proximaCita = citasInfo[0];
      const fechaProxima = new Date(proximaCita.fecha).toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      return {
        success: true,
        data: citasInfo,
        mensaje: `Tienes ${citas.length} cita(s) pendiente(s). Tu próxima cita es el ${fechaProxima} a las ${proximaCita.hora} para ${proximaCita.servicio}.`,
      };
    } catch (error) {
      this.logger.error('Error consultando citas', error);
      return {
        success: false,
        mensaje: 'Ocurrió un error al consultar las citas.',
        error_code: 'ERROR_INTERNO',
      };
    }
  }

  /**
   * Lista todos los exámenes disponibles con precios
   */
  async listarExamenes(): Promise<DialogflowResponseDto<PrecioExamenDto[]>> {
    this.logger.log('Listando exámenes disponibles');

    try {
      const examenes = await this.prisma.examen.findMany({
        where: { activo: true },
        include: {
          categoria: true,
          precios: {
            where: { activo: true },
            orderBy: { fecha_inicio: 'desc' },
            take: 1,
          },
        },
        orderBy: { nombre: 'asc' },
        take: 20,
      });

      if (examenes.length === 0) {
        return {
          success: true,
          data: [],
          mensaje: 'No hay exámenes disponibles actualmente.',
        };
      }

      const examenesInfo: PrecioExamenDto[] = examenes.map(e => ({
        nombre: e.nombre,
        precio: e.precios[0] ? Number(e.precios[0].precio) : 0,
        moneda: 'USD',
        categoria: e.categoria?.nombre,
        requiere_ayuno: e.requiere_ayuno,
        horas_ayuno: e.horas_ayuno || undefined,
      }));

      const conPrecio = examenesInfo.filter(e => e.precio > 0).slice(0, 5);
      const listaPrecios = conPrecio.map(e => `${e.nombre}: $${e.precio}`).join(', ');

      return {
        success: true,
        data: examenesInfo,
        mensaje: `Tenemos ${examenes.length} exámenes disponibles. Algunos ejemplos: ${listaPrecios}. ¿Cuál te interesa?`,
      };
    } catch (error) {
      this.logger.error('Error listando exámenes', error);
      return {
        success: false,
        mensaje: 'Ocurrió un error al consultar los exámenes.',
        error_code: 'ERROR_INTERNO',
      };
    }
  }
}
