import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Estado de la conversación de agendamiento
 */
interface AgendaConversationState {
    step: 'INICIAL' | 'SELECCIONAR_SERVICIO' | 'SELECCIONAR_FECHA' | 'SELECCIONAR_SLOT' | 'CONFIRMAR' | 'COMPLETADO';
    servicioId?: number;
    servicioNombre?: string;
    fecha?: string;
    slotId?: number;
    slotHora?: string;
    sedeNombre?: string;
}

/**
 * ChatbotAgendaService - HU-26: Gestión de Turnos vía Chatbot
 *
 * Permite a los pacientes:
 * - Consultar disponibilidad de citas
 * - Agendar una cita paso a paso
 * - Ver sus citas pendientes
 * - Cancelar citas
 */
@Injectable()
export class ChatbotAgendaService {
    private readonly logger = new Logger(ChatbotAgendaService.name);

    // Estado de conversaciones de agendamiento (sessionId -> state)
    private conversationStates = new Map<string, AgendaConversationState>();

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Inicia el flujo de agendamiento de citas
     */
    async iniciarAgendamiento(sessionId: string): Promise<{
        mensaje: string;
        opciones?: { id: number; nombre: string }[];
        accion: string;
    }> {
        // Obtener servicios disponibles
        const servicios = await this.prisma.servicio.findMany({
            where: { activo: true },
            select: {
                codigo_servicio: true,
                nombre: true,
                descripcion: true,
            },
            orderBy: { nombre: 'asc' },
        });

        if (servicios.length === 0) {
            return {
                mensaje: 'Lo sentimos, actualmente no tenemos servicios disponibles para agendar. Por favor, contacta directamente a nuestras sedes.',
                accion: 'NO_SERVICIOS',
            };
        }

        // Guardar estado de conversación
        this.conversationStates.set(sessionId, {
            step: 'SELECCIONAR_SERVICIO',
        });

        const listaServicios = servicios.map((s, idx) =>
            `${idx + 1}. ${s.nombre}${s.descripcion ? ` - ${s.descripcion}` : ''}`
        ).join('\n');

        return {
            mensaje: `Vamos a agendar tu cita.\n\nPor favor, selecciona el servicio que necesitas:\n\n${listaServicios}\n\nEscribe el numero del servicio o su nombre.`,
            opciones: servicios.map(s => ({ id: s.codigo_servicio, nombre: s.nombre })),
            accion: 'SELECCIONAR_SERVICIO',
        };
    }

    /**
     * Procesa la selección del servicio
     */
    async seleccionarServicio(sessionId: string, input: string): Promise<{
        mensaje: string;
        opciones?: any[];
        accion: string;
    }> {
        const state = this.conversationStates.get(sessionId);
        if (!state || state.step !== 'SELECCIONAR_SERVICIO') {
            return this.iniciarAgendamiento(sessionId);
        }

        // Buscar servicio por número o nombre
        const servicios = await this.prisma.servicio.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });

        let servicioSeleccionado: typeof servicios[0] | undefined;

        // Intentar por número
        const numero = parseInt(input);
        if (!isNaN(numero) && numero > 0 && numero <= servicios.length) {
            servicioSeleccionado = servicios[numero - 1];
        } else {
            // Intentar por nombre
            servicioSeleccionado = servicios.find(s =>
                s.nombre.toLowerCase().includes(input.toLowerCase())
            );
        }

        if (!servicioSeleccionado) {
            return {
                mensaje: `No encontré ese servicio. Por favor, selecciona un número del 1 al ${servicios.length} o escribe el nombre del servicio.`,
                accion: 'SELECCIONAR_SERVICIO_RETRY',
            };
        }

        // Buscar fechas disponibles (próximos 14 días)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const en14Dias = new Date(hoy);
        en14Dias.setDate(en14Dias.getDate() + 14);

        const slotsDisponibles = await this.prisma.slot.groupBy({
            by: ['fecha'],
            where: {
                codigo_servicio: servicioSeleccionado.codigo_servicio,
                activo: true,
                cupos_disponibles: { gt: 0 },
                fecha: {
                    gte: hoy,
                    lte: en14Dias,
                },
            },
            _count: {
                codigo_slot: true,
            },
            orderBy: {
                fecha: 'asc',
            },
        });

        if (slotsDisponibles.length === 0) {
            state.step = 'INICIAL';
            this.conversationStates.set(sessionId, state);
            return {
                mensaje: `Lo sentimos, no hay disponibilidad para ${servicioSeleccionado.nombre} en los proximos 14 dias.\n\nTe recomendamos:\n- Llamar a nuestras sedes para consultar disponibilidad\n- Intentar con otro servicio\n\nDeseas agendar otro servicio?`,
                accion: 'NO_DISPONIBILIDAD',
            };
        }

        // Actualizar estado
        state.step = 'SELECCIONAR_FECHA';
        state.servicioId = servicioSeleccionado.codigo_servicio;
        state.servicioNombre = servicioSeleccionado.nombre;
        this.conversationStates.set(sessionId, state);

        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const listaFechas = slotsDisponibles.slice(0, 7).map((slot, idx) => {
            const fecha = new Date(slot.fecha);
            const diaSemana = diasSemana[fecha.getDay()];
            const fechaStr = fecha.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
            return `${idx + 1}. ${diaSemana} ${fechaStr} (${slot._count.codigo_slot} horarios)`;
        }).join('\n');

        return {
            mensaje: `Has seleccionado: ${servicioSeleccionado.nombre}\n\nFechas disponibles:\n\n${listaFechas}\n\nEscribe el numero de la fecha o el dia (ej: "1" o "lunes")`,
            opciones: slotsDisponibles.slice(0, 7).map(s => ({
                fecha: new Date(s.fecha).toISOString().split('T')[0],
                disponibles: s._count.codigo_slot,
            })),
            accion: 'SELECCIONAR_FECHA',
        };
    }

    /**
     * Procesa la selección de fecha
     */
    async seleccionarFecha(sessionId: string, input: string): Promise<{
        mensaje: string;
        opciones?: { id: number; hora: string; sede: string }[];
        accion: string;
    }> {
        const state = this.conversationStates.get(sessionId);
        if (!state || state.step !== 'SELECCIONAR_FECHA') {
            return { mensaje: 'Por favor, inicia el proceso de agendamiento escribiendo "agendar cita".', accion: 'REINICIAR' };
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const en14Dias = new Date(hoy);
        en14Dias.setDate(en14Dias.getDate() + 14);

        // Obtener fechas disponibles
        const fechasDisponibles = await this.prisma.slot.groupBy({
            by: ['fecha'],
            where: {
                codigo_servicio: state.servicioId,
                activo: true,
                cupos_disponibles: { gt: 0 },
                fecha: { gte: hoy, lte: en14Dias },
            },
            orderBy: { fecha: 'asc' },
        });

        let fechaSeleccionada: Date | undefined;

        // Intentar por número
        const numero = parseInt(input);
        if (!isNaN(numero) && numero > 0 && numero <= fechasDisponibles.length) {
            fechaSeleccionada = new Date(fechasDisponibles[numero - 1].fecha);
        } else {
            // Intentar por día de la semana
            const diasPatrones = [
                { patron: /dom(ingo)?/i, dia: 0 },
                { patron: /lun(es)?/i, dia: 1 },
                { patron: /mar(tes)?/i, dia: 2 },
                { patron: /mi[eé]r?(coles)?/i, dia: 3 },
                { patron: /jue(ves)?/i, dia: 4 },
                { patron: /vie(rnes)?/i, dia: 5 },
                { patron: /s[aá]b(ado)?/i, dia: 6 },
            ];

            for (const { patron, dia } of diasPatrones) {
                if (patron.test(input)) {
                    fechaSeleccionada = fechasDisponibles.find(f =>
                        new Date(f.fecha).getDay() === dia
                    )?.fecha as Date | undefined;
                    break;
                }
            }
        }

        if (!fechaSeleccionada) {
            return {
                mensaje: `No entendí la fecha. Por favor, escribe el número (1-${fechasDisponibles.length}) o el día de la semana.`,
                accion: 'SELECCIONAR_FECHA_RETRY',
            };
        }

        // Buscar slots disponibles para esa fecha
        const slots = await this.prisma.slot.findMany({
            where: {
                codigo_servicio: state.servicioId,
                fecha: fechaSeleccionada,
                activo: true,
                cupos_disponibles: { gt: 0 },
            },
            include: {
                sede: true,
            },
            orderBy: { hora_inicio: 'asc' },
        });

        if (slots.length === 0) {
            return {
                mensaje: 'Lo sentimos, ya no hay horarios disponibles para esta fecha. Por favor, selecciona otra fecha.',
                accion: 'SELECCIONAR_FECHA_RETRY',
            };
        }

        // Actualizar estado
        state.step = 'SELECCIONAR_SLOT';
        state.fecha = fechaSeleccionada.toISOString().split('T')[0];
        this.conversationStates.set(sessionId, state);

        const listaHorarios = slots.slice(0, 10).map((slot, idx) => {
            // Extraer hora sin conversion de timezone (la BD guarda hora local)
            const horaDate = new Date(slot.hora_inicio);
            const horas = horaDate.getUTCHours().toString().padStart(2, '0');
            const minutos = horaDate.getUTCMinutes().toString().padStart(2, '0');
            const horaInicio = `${horas}:${minutos}`;
            return `${idx + 1}. ${horaInicio} - ${slot.sede?.nombre || 'Sede Principal'} (${slot.cupos_disponibles} cupos)`;
        }).join('\n');

        const fechaFormateada = new Date(fechaSeleccionada).toLocaleDateString('es-EC', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        return {
            mensaje: `Fecha seleccionada: ${fechaFormateada}\n\nHorarios disponibles:\n\n${listaHorarios}\n\nEscribe el numero del horario que prefieras.`,
            opciones: slots.slice(0, 10).map(s => {
                // Extraer hora sin conversion de timezone (la BD guarda hora local)
                const horaDate = new Date(s.hora_inicio);
                const horas = horaDate.getUTCHours().toString().padStart(2, '0');
                const minutos = horaDate.getUTCMinutes().toString().padStart(2, '0');
                return {
                    id: s.codigo_slot,
                    hora: `${horas}:${minutos}`,
                    sede: s.sede?.nombre || 'Sede Principal',
                };
            }),
            accion: 'SELECCIONAR_SLOT',
        };
    }

    /**
     * Procesa la selección del slot
     */
    async seleccionarSlot(sessionId: string, input: string, userId?: number): Promise<{
        mensaje: string;
        accion: string;
        requiresAuth?: boolean;
        citaResumen?: {
            servicio: string;
            fecha: string;
            hora: string;
            sede: string;
            slotId: number;
        };
    }> {
        const state = this.conversationStates.get(sessionId);
        if (!state || state.step !== 'SELECCIONAR_SLOT') {
            return { mensaje: 'Por favor, inicia el proceso de agendamiento escribiendo "agendar cita".', accion: 'REINICIAR' };
        }

        // Obtener slots disponibles
        const slots = await this.prisma.slot.findMany({
            where: {
                codigo_servicio: state.servicioId,
                fecha: new Date(state.fecha!),
                activo: true,
                cupos_disponibles: { gt: 0 },
            },
            include: { sede: true },
            orderBy: { hora_inicio: 'asc' },
        });

        const numero = parseInt(input);
        if (isNaN(numero) || numero < 1 || numero > slots.length) {
            return {
                mensaje: `Por favor, selecciona un número válido del 1 al ${slots.length}.`,
                accion: 'SELECCIONAR_SLOT_RETRY',
            };
        }

        const slotSeleccionado = slots[numero - 1];
        // Extraer hora sin conversion de timezone (la BD guarda hora local)
        const horaDate = new Date(slotSeleccionado.hora_inicio);
        const horasStr = horaDate.getUTCHours().toString().padStart(2, '0');
        const minutosStr = horaDate.getUTCMinutes().toString().padStart(2, '0');
        const horaFormateada = `${horasStr}:${minutosStr}`;

        // Actualizar estado
        state.step = 'CONFIRMAR';
        state.slotId = slotSeleccionado.codigo_slot;
        state.slotHora = horaFormateada;
        state.sedeNombre = slotSeleccionado.sede?.nombre || 'Sede Principal';
        this.conversationStates.set(sessionId, state);

        const fechaFormateada = new Date(state.fecha!).toLocaleDateString('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        // Verificar si el usuario está autenticado
        if (!userId) {
            return {
                mensaje: `Resumen de tu cita:\n\nServicio: ${state.servicioNombre}\nFecha: ${fechaFormateada}\nHora: ${horaFormateada}\nSede: ${state.sedeNombre}\n\nPara confirmar tu cita, necesitas iniciar sesion.\n\nPor favor, inicia sesion en tu cuenta y vuelve a este chat para confirmar.`,
                accion: 'REQUIERE_AUTENTICACION',
                requiresAuth: true,
                citaResumen: {
                    servicio: state.servicioNombre!,
                    fecha: fechaFormateada,
                    hora: horaFormateada,
                    sede: state.sedeNombre!,
                    slotId: slotSeleccionado.codigo_slot,
                },
            };
        }

        return {
            mensaje: `Resumen de tu cita:\n\nServicio: ${state.servicioNombre}\nFecha: ${fechaFormateada}\nHora: ${horaFormateada}\nSede: ${state.sedeNombre}\n\nDeseas confirmar esta cita?\nResponde "Si" para confirmar o "No" para cancelar.`,
            accion: 'CONFIRMAR',
            citaResumen: {
                servicio: state.servicioNombre!,
                fecha: fechaFormateada,
                hora: horaFormateada,
                sede: state.sedeNombre!,
                slotId: slotSeleccionado.codigo_slot,
            },
        };
    }

    /**
     * Confirma y crea la cita
     */
    async confirmarCita(sessionId: string, confirmar: boolean, userId: number): Promise<{
        mensaje: string;
        accion: string;
        cita?: any;
    }> {
        const state = this.conversationStates.get(sessionId);
        if (!state || state.step !== 'CONFIRMAR' || !state.slotId) {
            return {
                mensaje: 'Por favor, inicia el proceso de agendamiento escribiendo "agendar cita".',
                accion: 'REINICIAR'
            };
        }

        if (!confirmar) {
            this.conversationStates.delete(sessionId);
            return {
                mensaje: 'Tu cita no ha sido agendada. ¿Hay algo más en lo que pueda ayudarte?',
                accion: 'CANCELADO',
            };
        }

        try {
            // Verificar que el slot sigue disponible
            const slot = await this.prisma.slot.findUnique({
                where: { codigo_slot: state.slotId },
                include: { servicio: true, sede: true },
            });

            if (!slot || !slot.activo || slot.cupos_disponibles <= 0) {
                this.conversationStates.delete(sessionId);
                return {
                    mensaje: 'Lo sentimos, este horario ya no esta disponible. Alguien lo reservo mientras decidias.\n\nDeseas buscar otro horario? Escribe "agendar cita" para comenzar de nuevo.',
                    accion: 'SLOT_NO_DISPONIBLE',
                };
            }

            // Verificar si el paciente ya tiene cita en ese slot
            const citaExistente = await this.prisma.cita.findFirst({
                where: {
                    codigo_slot: state.slotId,
                    codigo_paciente: userId,
                    estado: { not: 'CANCELADA' },
                },
            });

            if (citaExistente) {
                this.conversationStates.delete(sessionId);
                return {
                    mensaje: 'Ya tienes una cita agendada en este horario. ¿Deseas ver tus citas? Escribe "mis citas".',
                    accion: 'CITA_DUPLICADA',
                };
            }

            // Crear cita en transacción
            const cita = await this.prisma.$transaction(async (prisma) => {
                // Decrementar cupos
                await prisma.slot.update({
                    where: { codigo_slot: state.slotId },
                    data: { cupos_disponibles: { decrement: 1 } },
                });

                // Crear cita
                return prisma.cita.create({
                    data: {
                        codigo_paciente: userId,
                        codigo_slot: state.slotId!,
                        estado: 'AGENDADA',
                        observaciones: 'Cita agendada vía chatbot',
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

            // Limpiar estado
            this.conversationStates.delete(sessionId);

            this.logger.log(`Cita ${cita.codigo_cita} creada vía chatbot para usuario ${userId}`);

            const fechaFormateada = new Date(slot.fecha).toLocaleDateString('es', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });

            return {
                mensaje: `Tu cita ha sido agendada exitosamente.\n\nCodigo de cita: #${cita.codigo_cita}\nServicio: ${slot.servicio.nombre}\nFecha: ${fechaFormateada}\nHora: ${state.slotHora}\nSede: ${slot.sede?.nombre || 'Sede Principal'}\n\nRecibiras un correo de confirmacion.\nRecuerda llegar 15 minutos antes de tu cita.\n\nHay algo mas en lo que pueda ayudarte?`,
                accion: 'CITA_CREADA',
                cita,
            };
        } catch (error) {
            this.logger.error('Error al crear cita via chatbot', error);
            this.conversationStates.delete(sessionId);
            return {
                mensaje: 'Ocurrió un error al agendar tu cita. Por favor, intenta de nuevo o contacta a nuestras sedes directamente.',
                accion: 'ERROR',
            };
        }
    }

    /**
     * Obtiene las citas del paciente
     */
    async consultarMisCitas(userId: number): Promise<{
        mensaje: string;
        citas: any[];
        accion: string;
    }> {
        if (!userId) {
            return {
                mensaje: '⚠️ Para ver tus citas, necesitas iniciar sesión en tu cuenta.',
                citas: [],
                accion: 'REQUIERE_AUTENTICACION',
            };
        }

        const citas = await this.prisma.cita.findMany({
            where: {
                codigo_paciente: userId,
                estado: { in: ['AGENDADA', 'PENDIENTE', 'CONFIRMADA'] },
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
            take: 5,
        });

        if (citas.length === 0) {
            return {
                mensaje: 'No tienes citas pendientes. ¿Deseas agendar una? Escribe "agendar cita".',
                citas: [],
                accion: 'SIN_CITAS',
            };
        }

        const listaCitas = citas.map((cita) => {
            const fecha = new Date(cita.slot.fecha).toLocaleDateString('es-EC', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit'
            });
            // Extraer hora directamente sin conversion de timezone (la BD guarda hora local)
            const horaDate = new Date(cita.slot.hora_inicio);
            const horas = horaDate.getUTCHours().toString().padStart(2, '0');
            const minutos = horaDate.getUTCMinutes().toString().padStart(2, '0');
            const hora = `${horas}:${minutos}`;
            const cancelable = (cita.estado === 'AGENDADA' || cita.estado === 'PENDIENTE') ? ' [Cancelable]' : '';
            return `Cita #${cita.codigo_cita} - ${cita.slot.servicio.nombre}\nFecha: ${fecha}, Hora: ${hora}\nSede: ${cita.slot.sede?.nombre || 'Sede'} | Estado: ${cita.estado}${cancelable}`;
        }).join('\n\n');

        // Solo mostrar opcion de cancelar si hay citas que se pueden cancelar (AGENDADA o PENDIENTE)
        const citasCancelables = citas.filter(c => c.estado === 'AGENDADA' || c.estado === 'PENDIENTE');
        let mensajeCancelar = '';
        if (citasCancelables.length > 0) {
            const codigosCancelables = citasCancelables.map(c => `#${c.codigo_cita}`).join(', ');
            mensajeCancelar = `\n\nPuedes cancelar: ${codigosCancelables}\nEscribe: "cancelar cita" seguido del numero (ej: "cancelar cita ${citasCancelables[0].codigo_cita}")`;
        } else {
            mensajeCancelar = '\n\nNota: Las citas confirmadas no pueden ser canceladas desde el chat.';
        }

        return {
            mensaje: `Tus proximas citas:\n\n${listaCitas}${mensajeCancelar}`,
            citas,
            accion: 'LISTAR_CITAS',
        };
    }

    /**
     * Cancela una cita del paciente
     */
    async cancelarCita(userId: number, codigoCita: number, motivo?: string): Promise<{
        mensaje: string;
        accion: string;
    }> {
        if (!userId) {
            return {
                mensaje: '⚠️ Para cancelar una cita, necesitas iniciar sesión en tu cuenta.',
                accion: 'REQUIERE_AUTENTICACION',
            };
        }

        const cita = await this.prisma.cita.findFirst({
            where: {
                codigo_cita: codigoCita,
                codigo_paciente: userId,
            },
            include: {
                slot: {
                    include: { servicio: true },
                },
            },
        });

        if (!cita) {
            return {
                mensaje: 'No encontré esa cita. Por favor, verifica el número de cita.',
                accion: 'CITA_NO_ENCONTRADA',
            };
        }

        if (cita.estado === 'CANCELADA') {
            return {
                mensaje: 'Esta cita ya fue cancelada anteriormente.',
                accion: 'YA_CANCELADA',
            };
        }

        if (cita.estado === 'CONFIRMADA') {
            return {
                mensaje: 'Las citas confirmadas no pueden ser canceladas desde el chat. Por favor, comunicate directamente con el laboratorio.',
                accion: 'CITA_CONFIRMADA',
            };
        }

        if (cita.estado === 'COMPLETADA') {
            return {
                mensaje: 'No es posible cancelar una cita que ya fue completada.',
                accion: 'CITA_COMPLETADA',
            };
        }

        // Cancelar en transacción
        await this.prisma.$transaction(async (prisma) => {
            // Incrementar cupos
            await prisma.slot.update({
                where: { codigo_slot: cita.codigo_slot },
                data: { cupos_disponibles: { increment: 1 } },
            });

            // Actualizar cita
            await prisma.cita.update({
                where: { codigo_cita: codigoCita },
                data: {
                    estado: 'CANCELADA',
                    motivo_cancelacion: motivo || 'Cancelado vía chatbot',
                },
            });
        });

        this.logger.log(`Cita ${codigoCita} cancelada vía chatbot por usuario ${userId}`);

        return {
            mensaje: `Tu cita #${codigoCita} (${cita.slot.servicio.nombre}) ha sido cancelada exitosamente.\n\nDeseas agendar una nueva cita? Escribe "agendar cita".`,
            accion: 'CITA_CANCELADA',
        };
    }

    /**
     * Consulta disponibilidad general
     */
    async consultarDisponibilidad(servicioNombre?: string): Promise<{
        mensaje: string;
        accion: string;
    }> {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const en7Dias = new Date(hoy);
        en7Dias.setDate(en7Dias.getDate() + 7);

        let where: any = {
            activo: true,
            cupos_disponibles: { gt: 0 },
            fecha: { gte: hoy, lte: en7Dias },
        };

        if (servicioNombre) {
            const servicio = await this.prisma.servicio.findFirst({
                where: {
                    nombre: { contains: servicioNombre, mode: 'insensitive' },
                    activo: true,
                },
            });

            if (servicio) {
                where.codigo_servicio = servicio.codigo_servicio;
            }
        }

        const disponibilidad = await this.prisma.slot.groupBy({
            by: ['codigo_servicio', 'fecha'],
            where,
            _count: { codigo_slot: true },
            orderBy: { fecha: 'asc' },
        });

        if (disponibilidad.length === 0) {
            return {
                mensaje: 'No hay disponibilidad en los próximos 7 días. Por favor, contacta a nuestras sedes.',
                accion: 'SIN_DISPONIBILIDAD',
            };
        }

        // Obtener nombres de servicios
        const servicioIds = [...new Set(disponibilidad.map(d => d.codigo_servicio))];
        const servicios = await this.prisma.servicio.findMany({
            where: { codigo_servicio: { in: servicioIds } },
        });
        const servicioMap = new Map(servicios.map(s => [s.codigo_servicio, s.nombre]));

        // Agrupar por servicio
        const disponibilidadPorServicio = disponibilidad.reduce((acc, d) => {
            const nombreServicio = servicioMap.get(d.codigo_servicio) || 'Servicio';
            if (!acc[nombreServicio]) acc[nombreServicio] = [];
            acc[nombreServicio].push({
                fecha: new Date(d.fecha).toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: '2-digit' }),
                horarios: d._count.codigo_slot,
            });
            return acc;
        }, {} as Record<string, { fecha: string; horarios: number }[]>);

        let mensaje = 'Disponibilidad para los proximos 7 dias:\n\n';
        for (const [servicio, fechas] of Object.entries(disponibilidadPorServicio)) {
            mensaje += `${servicio}:\n`;
            fechas.slice(0, 3).forEach(f => {
                mensaje += `  ${f.fecha} - ${f.horarios} horarios disponibles\n`;
            });
            mensaje += '\n';
        }

        mensaje += 'Deseas agendar una cita? Escribe "agendar cita".';

        return {
            mensaje,
            accion: 'MOSTRAR_DISPONIBILIDAD',
        };
    }

    /**
     * Procesa el input del usuario en el flujo de agendamiento
     */
    async procesarInputAgendamiento(sessionId: string, input: string, userId?: number): Promise<{
        mensaje: string;
        accion: string;
        requiresAuth?: boolean;
        citaResumen?: any;
        cita?: any;
    }> {
        const state = this.conversationStates.get(sessionId);

        if (!state) {
            return this.iniciarAgendamiento(sessionId);
        }

        switch (state.step) {
            case 'SELECCIONAR_SERVICIO':
                return this.seleccionarServicio(sessionId, input);

            case 'SELECCIONAR_FECHA':
                return this.seleccionarFecha(sessionId, input);

            case 'SELECCIONAR_SLOT':
                return this.seleccionarSlot(sessionId, input, userId);

            case 'CONFIRMAR':
                const esConfirmacion = /^(s[ií]|yes|ok|confirmar|confirmo|dale|claro)$/i.test(input.trim());
                const esNegacion = /^(no|nop|cancelar|cancelo)$/i.test(input.trim());

                if (!userId && esConfirmacion) {
                    return {
                        mensaje: '⚠️ Para confirmar tu cita, necesitas iniciar sesión primero.\n\nUna vez que inicies sesión, vuelve a este chat y escribe "confirmar" para completar tu cita.',
                        accion: 'REQUIERE_AUTENTICACION',
                        requiresAuth: true,
                    };
                }

                if (esConfirmacion || esNegacion) {
                    return this.confirmarCita(sessionId, esConfirmacion, userId!);
                }

                return {
                    mensaje: 'Por favor, responde "Sí" para confirmar tu cita o "No" para cancelar.',
                    accion: 'CONFIRMAR_RETRY',
                };

            default:
                return this.iniciarAgendamiento(sessionId);
        }
    }

    /**
     * Obtiene el estado actual de la conversación
     */
    getConversationState(sessionId: string): AgendaConversationState | undefined {
        return this.conversationStates.get(sessionId);
    }

    /**
     * Limpia el estado de conversación
     */
    clearConversationState(sessionId: string): void {
        this.conversationStates.delete(sessionId);
    }
}
