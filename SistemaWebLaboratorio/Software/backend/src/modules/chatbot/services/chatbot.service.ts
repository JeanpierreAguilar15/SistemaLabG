import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionsClient } from '@google-cloud/dialogflow';
import { PrismaService } from '@prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { UpdateChatbotConfigDto } from '../dto/chatbot.dto';

@Injectable()
export class ChatbotService implements OnModuleInit {
    private readonly logger = new Logger(ChatbotService.name);
    private sessionClient: SessionsClient;
    private projectId: string;
    private credentials: any;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        this.initializeDialogflow();
        await this.ensureDefaultConfig();
    }

    private initializeDialogflow() {
        this.projectId = this.configService.get<string>('DIALOGFLOW_PROJECT_ID');
        const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

        if (this.projectId && credentialsPath) {
            try {
                this.sessionClient = new SessionsClient({
                    keyFilename: credentialsPath,
                });
                this.logger.log('Dialogflow Session Client initialized');
            } catch (error) {
                this.logger.error('Error initializing Dialogflow', error);
            }
        }
    }

    private async ensureDefaultConfig() {
        const existingConfig = await this.prisma.configuracionChatbot.findFirst();
        if (!existingConfig) {
            await this.prisma.configuracionChatbot.create({
                data: {
                    activo: true,
                    umbral_confianza: 0.7,
                    mensaje_fallo: 'Lo siento, no entendí tu consulta. ¿Podrías reformularla?',
                    permitir_acceso_resultados: false,
                },
            });
            this.logger.log('Default chatbot configuration created');
        }
    }

    async getConfig() {
        return this.prisma.configuracionChatbot.findFirst();
    }

    async updateConfig(data: UpdateChatbotConfigDto) {
        const config = await this.prisma.configuracionChatbot.findFirst();
        if (config) {
            return this.prisma.configuracionChatbot.update({
                where: { codigo_configuracion: config.codigo_configuracion },
                data,
            });
        }
        return null;
    }

    async processMessage(sessionId: string, text: string, userId?: number) {
        // 1. Check if chatbot is active
        const config = await this.getConfig();
        if (!config || !config.activo) {
            return {
                text: 'El asistente virtual se encuentra temporalmente desactivado.',
                source: 'system',
            };
        }

        // 2. Send to Dialogflow
        if (!this.sessionClient) {
            return {
                text: '[MOCK] Dialogflow no configurado. Recibí: ' + text,
                source: 'mock',
            };
        }

        const sessionPath = this.sessionClient.projectAgentSessionPath(
            this.projectId,
            sessionId,
        );

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: text,
                    languageCode: 'es',
                },
            },
        };

        try {
            const responses = await this.sessionClient.detectIntent(request);
            const result = responses[0].queryResult;
            const intent = result.intent.displayName;
            const confidence = result.intentDetectionConfidence;
            let fulfillmentText = result.fulfillmentText;

            // 3. Check confidence threshold
            if (confidence < Number(config.umbral_confianza)) {
                return {
                    text: config.mensaje_fallo,
                    source: 'fallback',
                    intent,
                    confidence,
                };
            }

            // 4. Handle Fulfillment (Database Lookups)
            // This is where we inject real data based on the intent
            if (intent === 'consultar_precios' || intent === 'consultar_precio') {
                const examenNombre = result.parameters.fields.examen?.stringValue;
                if (examenNombre) {
                    const precioInfo = await this.consultarPrecio(examenNombre);
                    fulfillmentText = precioInfo.mensaje;
                }
            } else if (intent === 'consultar_sedes') {
                const sedesInfo = await this.consultarSedes();
                fulfillmentText = sedesInfo.mensaje;
            } else if (intent === 'consultar_servicios') {
                const serviciosInfo = await this.consultarServicios();
                fulfillmentText = serviciosInfo.mensaje;
            } else if (intent === 'consultar_paquetes') {
                const paquetesInfo = await this.consultarPaquetes();
                fulfillmentText = paquetesInfo.mensaje;
            } else if (intent === 'consultar_disponibilidad' || intent === 'consultar_citas') {
                const fecha = result.parameters.fields.date?.stringValue;
                const disponibilidadInfo = await this.consultarDisponibilidad(fecha);
                fulfillmentText = disponibilidadInfo.mensaje;
            } else if (intent === 'consultar_preparacion') {
                const examenNombre = result.parameters.fields.examen?.stringValue;
                if (examenNombre) {
                    const preparacionInfo = await this.consultarPreparacion(examenNombre);
                    fulfillmentText = preparacionInfo.mensaje;
                }
            } else if (intent === 'consultar_horarios') {
                const horariosInfo = await this.consultarHorarios();
                fulfillmentText = horariosInfo.mensaje;
            } else if (intent === 'consultar_categorias') {
                const categoriasInfo = await this.consultarCategorias();
                fulfillmentText = categoriasInfo.mensaje;
            } else if (intent === 'interpretar_resultado') {
                const examenNombre = result.parameters.fields.examen?.stringValue;
                const valor = result.parameters.fields.valor?.numberValue;
                if (examenNombre && valor !== undefined && config.permitir_acceso_resultados) {
                    const interpretacion = await this.interpretarResultado(examenNombre, valor);
                    fulfillmentText = interpretacion.mensaje;
                }
            }

            // 5. Log conversation
            await this.logMessage(sessionId, text, 'USER', userId);
            await this.logMessage(sessionId, fulfillmentText, 'BOT', null, intent, confidence);

            return {
                text: fulfillmentText,
                source: 'dialogflow',
                intent,
                confidence,
            };

        } catch (error) {
            this.logger.error('Error processing Dialogflow message', error);
            return {
                text: 'Lo siento, hubo un error al procesar tu mensaje.',
                source: 'error',
            };
        }
    }

    async interpretarResultado(examenNombre: string, valor: number) {
        this.logger.log(`Interpretando resultado: ${examenNombre} = ${valor}`);

        // 1. Buscar el examen en la BD (Case insensitive)
        const examen = await this.prisma.examen.findFirst({
            where: {
                nombre: {
                    contains: examenNombre,
                    mode: 'insensitive',
                },
            },
        });

        if (!examen) {
            return {
                mensaje: `Lo siento, no encontré información sobre el examen "${examenNombre}" en nuestra base de datos. Por favor verifica el nombre.`,
            };
        }

        // 2. Verificar si tiene rangos de referencia
        if (examen.valor_referencia_min === null || examen.valor_referencia_max === null) {
            return {
                mensaje: `El examen ${examen.nombre} no tiene rangos numéricos definidos para comparación automática. ${examen.valores_referencia_texto ? 'Referencia: ' + examen.valores_referencia_texto : ''}`,
            };
        }

        const min = Number(examen.valor_referencia_min);
        const max = Number(examen.valor_referencia_max);
        const unidad = examen.unidad_medida || '';

        // 3. Comparar valor
        let interpretacion = '';
        if (valor < min) {
            interpretacion = 'BAJO';
        } else if (valor > max) {
            interpretacion = 'ALTO';
        } else {
            interpretacion = 'NORMAL';
        }

        // 4. Construir respuesta amigable
        let mensaje = `Para ${examen.nombre}, el valor ${valor} ${unidad} se considera ${interpretacion}. \n`;
        mensaje += `El rango normal es de ${min} a ${max} ${unidad}.`;

        if (interpretacion !== 'NORMAL') {
            mensaje += `\n⚠️ Te recomendamos consultar con un médico para una evaluación completa.`;
        }

        return { mensaje };
    }

    async consultarPrecio(examenNombre: string) {
        this.logger.log(`Consultando precio de: ${examenNombre}`);

        const examen = await this.prisma.examen.findFirst({
            where: {
                nombre: { contains: examenNombre, mode: 'insensitive' },
                activo: true,
            },
            select: {
                nombre: true,
                descripcion: true,
                unidad_medida: true,
                categoria: { select: { nombre: true } },
                precios: {
                    where: { activo: true },
                    orderBy: { fecha_inicio: 'desc' },
                    take: 1,
                    select: { precio: true }
                }
            },
        });

        if (!examen) {
            return {
                mensaje: `No encontré el examen "${examenNombre}" en nuestro catálogo.`,
                encontrado: false,
            };
        }

        const categoriaNombre = examen.categoria?.nombre || 'análisis';
        const precioActual = examen.precios[0]?.precio;
        const precio = precioActual ? `S/. ${precioActual}` : 'consultar';
        const mensaje = `El examen de ${examen.nombre} cuesta ${precio}. ${examen.descripcion || 'Estudio de ' + categoriaNombre}.`.trim();

        return {
            mensaje,
            encontrado: true,
            examen: examen.nombre,
            precio: precioActual,
            categoria: categoriaNombre,
        };
    }

    async consultarSedes() {
        this.logger.log('Consultando sedes disponibles');

        const sedes = await this.prisma.sede.findMany({
            where: { activo: true },
            select: {
                codigo_sede: true,
                nombre: true,
                direccion: true,
                telefono: true,
                horarios: true,
            },
        });

        if (sedes.length === 0) {
            return { mensaje: 'No hay sedes disponibles', sedes: [] };
        }

        const listaSedes = sedes.map(
            (s) => `🏥 ${s.nombre}: ${s.direccion} (${s.horarios?.map(h => h.dia_semana).join(', ') || 'Horario no disponible'})`,
        ).join('\n');

        return {
            mensaje: `Contamos con ${sedes.length} sedes:\n\n${listaSedes}`,
            sedes: sedes.map((s) => ({
                nombre: s.nombre,
                direccion: s.direccion,
                telefono: s.telefono,
                horario: s.horarios,
            })),
        };
    }

    async consultarServicios() {
        this.logger.log('Consultando servicios disponibles');

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
            return { mensaje: 'No hay servicios disponibles', servicios: [] };
        }

        const listaServicios = servicios.map(
            (srv) => `🔬 ${srv.nombre}${srv.descripcion ? ': ' + srv.descripcion : ''}`,
        ).join('\n');

        return {
            mensaje: `Ofrecemos ${servicios.length} servicio(s):\n\n${listaServicios}`,
            servicios: servicios.map((s) => ({
                nombre: s.nombre,
                descripcion: s.descripcion,
            })),
        };
    }

    /**
     * Consultar paquetes de exámenes disponibles
     */
    async consultarPaquetes() {
        this.logger.log('Consultando paquetes de exámenes');

        const paquetes = await this.prisma.paquete.findMany({
            where: { activo: true },
            include: {
                examenes: {
                    include: {
                        examen: {
                            select: { nombre: true },
                        },
                    },
                },
            },
            orderBy: { nombre: 'asc' },
        });

        if (paquetes.length === 0) {
            return { mensaje: 'No hay paquetes disponibles actualmente.', paquetes: [] };
        }

        const listaPaquetes = paquetes.map((paq) => {
            const precio = paq.precio_paquete ? `S/. ${paq.precio_paquete}` : 'Consultar';
            const examenes = paq.examenes.map((e) => e.examen.nombre).join(', ');
            return `📦 ${paq.nombre} - ${precio}\n   Incluye: ${examenes}`;
        }).join('\n\n');

        return {
            mensaje: `Tenemos ${paquetes.length} paquete(s) disponibles:\n\n${listaPaquetes}`,
            paquetes: paquetes.map((p) => ({
                nombre: p.nombre,
                descripcion: p.descripcion,
                precio: p.precio_paquete,
                examenes: p.examenes.map((e) => e.examen.nombre),
            })),
        };
    }

    /**
     * Consultar disponibilidad de citas para una fecha
     */
    async consultarDisponibilidad(fecha?: string) {
        this.logger.log(`Consultando disponibilidad para: ${fecha || 'próximos días'}`);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let fechaBusqueda: Date;
        let fechaFin: Date;

        if (fecha) {
            fechaBusqueda = new Date(fecha);
            fechaFin = new Date(fecha);
            fechaFin.setHours(23, 59, 59, 999);
        } else {
            fechaBusqueda = hoy;
            fechaFin = new Date(hoy);
            fechaFin.setDate(fechaFin.getDate() + 7); // Próximos 7 días
        }

        const slots = await this.prisma.slot.findMany({
            where: {
                fecha: {
                    gte: fechaBusqueda,
                    lte: fechaFin,
                },
                activo: true,
                cupos_disponibles: { gt: 0 },
            },
            include: {
                servicio: { select: { nombre: true } },
                sede: { select: { nombre: true } },
            },
            orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
            take: 10,
        });

        if (slots.length === 0) {
            return {
                mensaje: fecha
                    ? `No hay citas disponibles para el ${fecha}. Te sugerimos consultar otras fechas.`
                    : 'No hay citas disponibles en los próximos días. Por favor contáctanos directamente.',
                disponibilidad: [],
            };
        }

        // Agrupar por fecha
        const porFecha = slots.reduce((acc, slot) => {
            const fechaStr = new Date(slot.fecha).toLocaleDateString('es-EC', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            });
            if (!acc[fechaStr]) acc[fechaStr] = [];
            const hora = new Date(slot.hora_inicio).toLocaleTimeString('es-EC', {
                hour: '2-digit',
                minute: '2-digit',
            });
            acc[fechaStr].push(`${hora} (${slot.cupos_disponibles} cupos) - ${slot.sede.nombre}`);
            return acc;
        }, {} as Record<string, string[]>);

        const listaDisponibilidad = Object.entries(porFecha)
            .map(([fecha, horarios]) => `📅 ${fecha}:\n   ${horarios.join('\n   ')}`)
            .join('\n\n');

        return {
            mensaje: `Tenemos disponibilidad:\n\n${listaDisponibilidad}\n\nPuedes agendar tu cita desde el portal web.`,
            disponibilidad: slots.map((s) => ({
                fecha: s.fecha,
                hora: s.hora_inicio,
                cupos: s.cupos_disponibles,
                sede: s.sede.nombre,
            })),
        };
    }

    /**
     * Consultar preparación requerida para un examen
     */
    async consultarPreparacion(examenNombre: string) {
        this.logger.log(`Consultando preparación para: ${examenNombre}`);

        const examen = await this.prisma.examen.findFirst({
            where: {
                OR: [
                    { nombre: { contains: examenNombre, mode: 'insensitive' } },
                    { codigo_interno: { contains: examenNombre, mode: 'insensitive' } },
                ],
                activo: true,
            },
        });

        if (!examen) {
            return {
                mensaje: `No encontré el examen "${examenNombre}". Por favor verifica el nombre o consulta nuestro catálogo.`,
            };
        }

        let mensaje = `📋 Preparación para ${examen.nombre}:\n\n`;

        if (examen.requiere_ayuno) {
            mensaje += '⏰ REQUIERE AYUNO: Sí (mínimo 8-12 horas)\n';
        } else {
            mensaje += '⏰ Ayuno: No requerido\n';
        }

        if (examen.instrucciones_preparacion) {
            mensaje += `\n📝 Instrucciones especiales:\n${examen.instrucciones_preparacion}\n`;
        }

        if (examen.tiempo_entrega_horas) {
            mensaje += `\n🕐 Tiempo de entrega: ${examen.tiempo_entrega_horas} horas`;
        }

        if (!examen.requiere_ayuno && !examen.instrucciones_preparacion) {
            mensaje += '\n✅ No requiere preparación especial.';
        }

        return {
            mensaje,
            examen: {
                nombre: examen.nombre,
                requiere_ayuno: examen.requiere_ayuno,
                requiere_preparacion: !!examen.instrucciones_preparacion,
                instrucciones: examen.instrucciones_preparacion,
                tiempo_entrega: examen.tiempo_entrega_horas,
            },
        };
    }

    /**
     * Consultar horarios de atención
     */
    async consultarHorarios() {
        this.logger.log('Consultando horarios de atención');

        const sedes = await this.prisma.sede.findMany({
            where: { activo: true },
            include: {
                horarios: {
                    orderBy: { dia_semana: 'asc' },
                },
            },
        });

        if (sedes.length === 0) {
            return { mensaje: 'No hay información de horarios disponible.' };
        }

        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        const listaHorarios = sedes.map((sede) => {
            const horarios = sede.horarios.map((h) => {
                const dia = diasSemana[h.dia_semana - 1] || `Día ${h.dia_semana}`;
                const inicio = new Date(h.hora_inicio).toLocaleTimeString('es-EC', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                const fin = new Date(h.hora_fin).toLocaleTimeString('es-EC', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                return `   ${dia}: ${inicio} - ${fin}`;
            }).join('\n');

            return `🏥 ${sede.nombre}\n📍 ${sede.direccion}\n📞 ${sede.telefono || 'No disponible'}\n${horarios || '   Horario no especificado'}`;
        }).join('\n\n');

        return {
            mensaje: `Nuestros horarios de atención:\n\n${listaHorarios}`,
            sedes: sedes.map((s) => ({
                nombre: s.nombre,
                direccion: s.direccion,
                telefono: s.telefono,
                horarios: s.horarios,
            })),
        };
    }

    /**
     * Consultar categorías de exámenes
     */
    async consultarCategorias() {
        this.logger.log('Consultando categorías de exámenes');

        const categorias = await this.prisma.categoriaExamen.findMany({
            where: { activo: true },
            include: {
                _count: {
                    select: { examenes: true },
                },
            },
            orderBy: { nombre: 'asc' },
        });

        if (categorias.length === 0) {
            return { mensaje: 'No hay categorías disponibles.' };
        }

        const listaCategorias = categorias.map(
            (cat) => `📁 ${cat.nombre} (${cat._count.examenes} exámenes)${cat.descripcion ? '\n   ' + cat.descripcion : ''}`
        ).join('\n');

        return {
            mensaje: `Tenemos las siguientes categorías de exámenes:\n\n${listaCategorias}\n\nPuedes preguntarme por exámenes específicos de cada categoría.`,
            categorias: categorias.map((c) => ({
                nombre: c.nombre,
                descripcion: c.descripcion,
                cantidad_examenes: c._count.examenes,
            })),
        };
    }

    private async logMessage(
        sessionId: string,
        content: string,
        remitente: 'USER' | 'BOT',
        userId?: number,
        intent?: string,
        confidence?: number,
    ) {
        try {
            // Buscar o crear conversación activa
            let conversacion = await this.prisma.conversacionChatbot.findFirst({
                where: {
                    session_id: sessionId,
                    activa: true,
                },
            });

            if (!conversacion) {
                conversacion = await this.prisma.conversacionChatbot.create({
                    data: {
                        session_id: sessionId,
                        codigo_paciente: userId,
                    },
                });
            }

            // Registrar mensaje
            await this.prisma.mensajeChatbot.create({
                data: {
                    codigo_conversacion: conversacion.codigo_conversacion,
                    remitente,
                    contenido: content,
                    intent,
                    confianza: confidence ? Number(confidence) : null,
                },
            });

            // Actualizar última actividad
            await this.prisma.conversacionChatbot.update({
                where: { codigo_conversacion: conversacion.codigo_conversacion },
                data: { fecha_ultimo_msg: new Date() },
            });

        } catch (error) {
            this.logger.error('Error logging chatbot message', error);
        }
    }
}

