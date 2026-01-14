import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatbotService } from '../services/chatbot.service';
import { Logger } from '@nestjs/common';

/**
 * Tipos de cliente conectado
 */
interface ConnectedClient {
    socketId: string;
    sessionId: string;
    userId?: number;
    userName?: string;
}

/**
 * ChatGateway - Gateway WebSocket para chat en tiempo real con el bot
 */
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'chatbot',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    // Clientes conectados
    private connectedClients = new Map<string, ConnectedClient>();

    constructor(
        private readonly chatbotService: ChatbotService,
    ) {}

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);

        // Registrar cliente básico
        this.connectedClients.set(client.id, {
            socketId: client.id,
            sessionId: client.id,
        });
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * Usuario se registra con su sessionId
     */
    @SubscribeMessage('register')
    handleRegister(
        @MessageBody() data: { sessionId: string; userId?: number; userName?: string },
        @ConnectedSocket() client: Socket,
    ) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            clientInfo.sessionId = data.sessionId;
            clientInfo.userId = data.userId;
            clientInfo.userName = data.userName || 'Usuario';
            this.connectedClients.set(client.id, clientInfo);
        }

        // Unir a room de sesión
        client.join(`session:${data.sessionId}`);

        this.logger.log(`Client ${client.id} registered with session: ${data.sessionId}`);

        client.emit('registered', { sessionId: data.sessionId });
    }

    /**
     * Mensaje de usuario procesado por el bot
     */
    @SubscribeMessage('message')
    async handleMessage(
        @MessageBody() data: { content: string; sessionId?: string },
        @ConnectedSocket() client: Socket,
    ) {
        const clientInfo = this.connectedClients.get(client.id);
        const sessionId = data.sessionId || clientInfo?.sessionId || client.id;

        // Procesar con chatbot
        const response = await this.chatbotService.processMessage(
            sessionId,
            data.content,
            clientInfo?.userId,
        );

        // Enviar respuesta al cliente
        client.emit('response', {
            ...response,
            sessionId,
            timestamp: new Date(),
        });
    }

    /**
     * Obtener estadísticas de conexiones
     */
    getConnectionStats() {
        return {
            totalClients: this.connectedClients.size,
        };
    }
}
