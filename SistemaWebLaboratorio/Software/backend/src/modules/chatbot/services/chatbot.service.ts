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
            if (intent === 'consultar_precios' && config.permitir_acceso_resultados) {
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

