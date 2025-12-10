import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionsClient } from '@google-cloud/dialogflow';
import { PrismaService } from '@prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { UpdateChatbotConfigDto } from '../dto/chatbot.dto';
import { ChatbotAgendaService } from './chatbot-agenda.service';

/**
 * Patrones de intents para detección local cuando Dialogflow no está configurado
 */
interface LocalIntentPattern {
    intent: string;
    patterns: RegExp[];
    handler: string;
}

@Injectable()
export class ChatbotService implements OnModuleInit {
    private readonly logger = new Logger(ChatbotService.name);
    private sessionClient: SessionsClient;
    private projectId: string;
    private credentials: any;

    // Patrones locales para FAQ cuando Dialogflow no está disponible
    private readonly localIntentPatterns: LocalIntentPattern[] = [
        {
            intent: 'consultar_precios',
            patterns: [
                /(?:cuánto|cuanto|precio|costo|vale|cuesta).*(?:examen|análisis|prueba|hemograma|glucosa|perfil)/i,
                /precio(?:s)?/i,
            ],
            handler: 'handlePreciosIntent',
        },
        {
            intent: 'consultar_sedes',
            patterns: [
                /(?:dónde|donde|ubicación|ubicacion|dirección|direccion|sede|local|sucursal)/i,
                /(?:están|estan|encuentran|quedan).*(?:ubicados|localizados)/i,
            ],
            handler: 'handleSedesIntent',
        },
        {
            intent: 'consultar_horarios',
            patterns: [
                /(?:horario|hora|cuando|cuándo|abierto|atención|atencion|abren|cierran)/i,
                /(?:a qué|a que) hora/i,
            ],
            handler: 'handleHorariosIntent',
        },
        {
            intent: 'consultar_servicios',
            patterns: [
                /(?:servicio|qué|que).*(?:ofrecen|hacen|realizan)/i,
                /(?:tipo|lista).*(?:exámenes|examenes|análisis|analisis)/i,
            ],
            handler: 'handleServiciosIntent',
        },
        {
            intent: 'consultar_preparacion',
            patterns: [
                /(?:prepara|preparación|preparacion|ayuno|requisito|antes|debo|necesito)/i,
                /(?:cómo|como) (?:me )?(?:preparo|preparar)/i,
                /(?:instrucciones?)/i,
            ],
            handler: 'handlePreparacionIntent',
        },
        {
            intent: 'saludar',
            patterns: [
                /^(?:hola|buenos días|buenas tardes|buenas noches|hi|hello|hey)/i,
            ],
            handler: 'handleSaludoIntent',
        },
        {
            intent: 'agradecer',
            patterns: [
                /(?:gracias|muchas gracias|te agradezco|agradecido)/i,
            ],
            handler: 'handleAgradecimientoIntent',
        },
        {
            intent: 'despedida',
            patterns: [
                /(?:adiós|adios|chao|hasta luego|nos vemos|bye)/i,
            ],
            handler: 'handleDespedidaIntent',
        },
        // HU-26: Intents de gestión de turnos
        {
            intent: 'agendar_cita',
            patterns: [
                /(?:agendar|reservar|sacar|pedir|solicitar).*(?:cita|turno|hora)/i,
                /(?:quiero|necesito|deseo).*(?:cita|turno|hora)/i,
                /(?:cita|turno|hora).*(?:nueva|nuevo)/i,
            ],
            handler: 'handleAgendarCitaIntent',
        },
        {
            intent: 'consultar_citas',
            patterns: [
                /(?:mis|ver|consultar|listar).*(?:cita|turno|hora)s?/i,
                /(?:tengo).*(?:cita|turno)s?/i,
                /(?:cuándo|cuando) (?:es|son) mi(?:s)? (?:cita|turno)s?/i,
            ],
            handler: 'handleConsultarCitasIntent',
        },
        {
            intent: 'cancelar_cita',
            patterns: [
                /(?:cancelar|anular|eliminar).*(?:cita|turno)/i,
                /(?:no puedo|no voy).*(?:ir|asistir)/i,
            ],
            handler: 'handleCancelarCitaIntent',
        },
        {
            intent: 'ver_disponibilidad',
            patterns: [
                /(?:disponibilidad|horarios? disponibles?|hay (?:citas?|turnos?|horas?))/i,
                /(?:cuándo|cuando) (?:puedo|hay)/i,
            ],
            handler: 'handleDisponibilidadIntent',
        },
        {
            intent: 'hablar_operador',
            patterns: [
                /(?:hablar|contactar|comunicar).*(?:operador|persona|humano|agente)/i,
                /(?:necesito|quiero).*(?:ayuda|persona|humano)/i,
            ],
            handler: 'handleOperadorIntent',
        },
    ];

    // Estado de flujo de agendamiento para cada sesión
    private agendaFlowStates = new Map<string, boolean>();

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ChatbotAgendaService))
        private readonly agendaService: ChatbotAgendaService,
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

        // 2. Si Dialogflow no está configurado, usar detección local de intents
        if (!this.sessionClient) {
            return this.processMessageLocally(sessionId, text, userId);
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
            fulfillmentText = await this.handleFulfillment(intent, result.parameters?.fields, fulfillmentText);

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
            // Fallback a procesamiento local si Dialogflow falla
            return this.processMessageLocally(sessionId, text, userId);
        }
    }

    /**
     * Procesa mensajes localmente usando patrones de regex
     * Se usa cuando Dialogflow no está configurado o falla
     */
    private async processMessageLocally(sessionId: string, text: string, userId?: number) {
        this.logger.log(`Processing message locally: ${text}`);

        // Verificar si estamos en flujo de agendamiento
        const agendaState = this.agendaService.getConversationState(sessionId);
        if (agendaState) {
            const result = await this.agendaService.procesarInputAgendamiento(sessionId, text, userId);
            await this.logMessage(sessionId, text, 'USER', userId);
            await this.logMessage(sessionId, result.mensaje, 'BOT', null, 'agenda_flow', 0.9);

            return {
                text: result.mensaje,
                source: 'local',
                intent: 'agenda_flow',
                confidence: 0.9,
                accion: result.accion,
                requiresAuth: result.requiresAuth,
                citaResumen: result.citaResumen,
            };
        }

        // Detectar intent usando patrones locales
        let detectedIntent: string | null = null;
        let extractedEntity: string | null = null;

        for (const pattern of this.localIntentPatterns) {
            for (const regex of pattern.patterns) {
                if (regex.test(text)) {
                    detectedIntent = pattern.intent;
                    break;
                }
            }
            if (detectedIntent) break;
        }

        // Extraer entidades (nombre de examen) del texto
        const examenMatch = text.match(/(?:examen|prueba|análisis|test)\s+(?:de\s+)?(\w+(?:\s+\w+)?)/i);
        if (examenMatch) {
            extractedEntity = examenMatch[1];
        }

        // Extraer código de cita para cancelación
        const citaMatch = text.match(/#?(\d+)/);
        const codigoCita = citaMatch ? parseInt(citaMatch[1]) : null;

        // Manejar intent detectado
        let responseText: string;
        let accion: string | undefined;
        let requiresAuth: boolean | undefined;

        switch (detectedIntent) {
            case 'saludar':
                responseText = await this.handleSaludoIntent();
                break;
            case 'consultar_precios':
                responseText = await this.handlePreciosIntent(extractedEntity);
                break;
            case 'consultar_sedes':
                responseText = (await this.consultarSedes()).mensaje;
                break;
            case 'consultar_horarios':
                responseText = await this.handleHorariosIntent();
                break;
            case 'consultar_servicios':
                responseText = (await this.consultarServicios()).mensaje;
                break;
            case 'consultar_preparacion':
                responseText = await this.handlePreparacionIntent(extractedEntity || text);
                break;
            case 'agradecer':
                responseText = '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?';
                break;
            case 'despedida':
                responseText = '¡Hasta luego! Fue un placer ayudarte. No dudes en volver si tienes más preguntas.';
                break;
            // HU-26: Gestión de Turnos
            case 'agendar_cita': {
                const result = await this.agendaService.iniciarAgendamiento(sessionId);
                responseText = result.mensaje;
                accion = result.accion;
                break;
            }
            case 'consultar_citas': {
                if (!userId) {
                    responseText = '⚠️ Para ver tus citas, necesitas iniciar sesión en tu cuenta primero.';
                    requiresAuth = true;
                } else {
                    const result = await this.agendaService.consultarMisCitas(userId);
                    responseText = result.mensaje;
                    accion = result.accion;
                }
                break;
            }
            case 'cancelar_cita': {
                if (!userId) {
                    responseText = '⚠️ Para cancelar una cita, necesitas iniciar sesión en tu cuenta primero.';
                    requiresAuth = true;
                } else if (codigoCita) {
                    const result = await this.agendaService.cancelarCita(userId, codigoCita);
                    responseText = result.mensaje;
                    accion = result.accion;
                } else {
                    responseText = 'Por favor, indica el número de la cita que deseas cancelar. Por ejemplo: "cancelar cita #123"';
                }
                break;
            }
            case 'ver_disponibilidad': {
                const result = await this.agendaService.consultarDisponibilidad(extractedEntity || undefined);
                responseText = result.mensaje;
                accion = result.accion;
                break;
            }
            case 'hablar_operador':
                responseText = 'Puedo transferirte con un operador humano. ¿Deseas que te conecte con uno de nuestros agentes?';
                accion = 'HANDOFF_SUGERIDO';
                break;
            default:
                responseText = this.getDefaultResponse();
        }

        // Log conversation
        await this.logMessage(sessionId, text, 'USER', userId);
        await this.logMessage(sessionId, responseText, 'BOT', null, detectedIntent || 'unknown', 0.8);

        return {
            text: responseText,
            source: 'local',
            intent: detectedIntent || 'unknown',
            confidence: detectedIntent ? 0.8 : 0.3,
            accion,
            requiresAuth,
        };
    }

    /**
     * Maneja el fulfillment de intents con datos de la BD
     */
    private async handleFulfillment(intent: string, parameters: any, defaultText: string): Promise<string> {
        switch (intent) {
            case 'consultar_precios':
                const examenNombre = parameters?.examen?.stringValue;
                if (examenNombre) {
                    const precioInfo = await this.consultarPrecio(examenNombre);
                    return precioInfo.mensaje;
                }
                return await this.handlePreciosIntent(null);

            case 'consultar_sedes':
                return (await this.consultarSedes()).mensaje;

            case 'consultar_servicios':
                return (await this.consultarServicios()).mensaje;

            case 'consultar_horarios':
                return await this.handleHorariosIntent();

            case 'consultar_preparacion':
                const examen = parameters?.examen?.stringValue;
                return await this.handlePreparacionIntent(examen);

            default:
                return defaultText;
        }
    }

    /**
     * Respuesta para saludo
     */
    private async handleSaludoIntent(): Promise<string> {
        const hora = new Date().getHours();
        let saludo = 'Hola';
        if (hora < 12) saludo = 'Buenos días';
        else if (hora < 18) saludo = 'Buenas tardes';
        else saludo = 'Buenas noches';

        return `${saludo}! Soy el asistente virtual de Laboratorio Clínico Franz. Puedo ayudarte con:\n\n` +
            `📅 **Gestión de citas:**\n` +
            `- Agendar una cita\n` +
            `- Ver mis citas\n` +
            `- Cancelar una cita\n\n` +
            `📋 **Información:**\n` +
            `- Precios de exámenes\n` +
            `- Ubicación de sedes\n` +
            `- Horarios de atención\n` +
            `- Preparación para exámenes\n\n` +
            `¿En qué puedo ayudarte?`;
    }

    /**
     * Maneja consultas de precios
     */
    private async handlePreciosIntent(examenNombre: string | null): Promise<string> {
        if (examenNombre) {
            const precioInfo = await this.consultarPrecio(examenNombre);
            return precioInfo.mensaje;
        }

        // Listar exámenes populares con precios
        const examenes = await this.prisma.examen.findMany({
            where: { activo: true },
            select: {
                nombre: true,
                precios: {
                    where: { activo: true },
                    orderBy: { fecha_inicio: 'desc' },
                    take: 1,
                    select: { precio: true }
                }
            },
            take: 5,
            orderBy: { nombre: 'asc' },
        });

        if (examenes.length === 0) {
            return 'Por el momento no tengo información de precios disponible. Por favor llámanos para más detalles.';
        }

        const lista = examenes.map(e => {
            const precio = e.precios[0]?.precio;
            return `- ${e.nombre}: ${precio ? 'S/. ' + precio : 'Consultar'}`;
        }).join('\n');

        return `Estos son algunos de nuestros exámenes:\n\n${lista}\n\n¿Te gustaría saber el precio de algún examen específico?`;
    }

    /**
     * Maneja consultas de horarios
     */
    private async handleHorariosIntent(): Promise<string> {
        const horarios = await this.prisma.horarioAtencion.findMany({
            where: { activo: true },
            include: {
                sede: true,
                servicio: true,
            },
            orderBy: [
                { codigo_sede: 'asc' },
                { dia_semana: 'asc' },
            ],
        });

        if (horarios.length === 0) {
            return 'Nuestro horario general es de Lunes a Viernes de 7:00 AM a 5:00 PM, y Sábados de 7:00 AM a 1:00 PM.';
        }

        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        // Agrupar por sede
        const horariosPorSede = horarios.reduce((acc, h) => {
            const sedeName = h.sede?.nombre || 'General';
            if (!acc[sedeName]) acc[sedeName] = [];
            acc[sedeName].push(h);
            return acc;
        }, {} as Record<string, typeof horarios>);

        let mensaje = '🕐 Horarios de atención:\n\n';
        for (const [sede, hrs] of Object.entries(horariosPorSede)) {
            mensaje += `📍 ${sede}:\n`;
            hrs.forEach(h => {
                const dia = diasSemana[h.dia_semana];
                const inicio = new Date(h.hora_inicio).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
                const fin = new Date(h.hora_fin).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
                mensaje += `  ${dia}: ${inicio} - ${fin}\n`;
            });
            mensaje += '\n';
        }

        return mensaje.trim();
    }

    /**
     * Maneja consultas de preparación para exámenes
     * Base de conocimiento: instrucciones_preparacion de la tabla Examen
     */
    private async handlePreparacionIntent(texto: string): Promise<string> {
        // Buscar examen por nombre
        const examen = await this.prisma.examen.findFirst({
            where: {
                OR: [
                    { nombre: { contains: texto, mode: 'insensitive' } },
                    { descripcion: { contains: texto, mode: 'insensitive' } },
                ],
                activo: true,
            },
            select: {
                nombre: true,
                requiere_ayuno: true,
                horas_ayuno: true,
                instrucciones_preparacion: true,
                tiempo_entrega_horas: true,
                tipo_muestra: true,
            },
        });

        if (!examen) {
            // Mostrar instrucciones generales
            return `Para la mayoría de nuestros exámenes de sangre, recomendamos:\n\n` +
                `🍽️ Ayuno de 8-12 horas (solo agua)\n` +
                `💧 Mantenerse bien hidratado\n` +
                `💊 Informar sobre medicamentos que esté tomando\n` +
                `🩺 Traer orden médica si es requerida\n\n` +
                `¿Me puedes indicar qué examen específico te vas a realizar para darte instrucciones detalladas?`;
        }

        let mensaje = `📋 Preparación para ${examen.nombre}:\n\n`;

        if (examen.requiere_ayuno) {
            mensaje += `🍽️ Ayuno: Sí, ${examen.horas_ayuno || 8} horas (solo puede tomar agua)\n`;
        } else {
            mensaje += `🍽️ Ayuno: No requerido\n`;
        }

        if (examen.tipo_muestra) {
            mensaje += `🧪 Tipo de muestra: ${examen.tipo_muestra}\n`;
        }

        if (examen.instrucciones_preparacion) {
            mensaje += `\n📝 Instrucciones especiales:\n${examen.instrucciones_preparacion}\n`;
        }

        if (examen.tiempo_entrega_horas) {
            const horas = examen.tiempo_entrega_horas;
            const dias = Math.ceil(horas / 24);
            mensaje += `\n⏱️ Tiempo de entrega: ${dias > 1 ? `${dias} días` : `${horas} horas`}`;
        }

        return mensaje;
    }

    /**
     * Respuesta por defecto cuando no se detecta intent
     */
    private getDefaultResponse(): string {
        const respuestas = [
            'No estoy seguro de entender tu consulta. ¿Podrías reformularla? Puedo ayudarte con información sobre precios, sedes, horarios, preparación para exámenes y servicios.',
            'Disculpa, no logré entender tu mensaje. ¿Podrías ser más específico? Puedo ayudarte con precios, ubicaciones, horarios o preparación para exámenes.',
            'Lo siento, no comprendí tu consulta. Puedo ayudarte con:\n- Precios de exámenes\n- Ubicación de sedes\n- Horarios de atención\n- Preparación para exámenes\n- Servicios disponibles',
        ];
        return respuestas[Math.floor(Math.random() * respuestas.length)];
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

