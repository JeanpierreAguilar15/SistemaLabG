import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatbotService } from '../services/chatbot.service';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'chatbot',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChatGateway.name);

    constructor(private readonly chatbotService: ChatbotService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('message')
    async handleMessage(
        @MessageBody() data: { content: string; sessionId?: string },
        @ConnectedSocket() client: Socket,
    ) {
        const sessionId = data.sessionId || client.id; // Use socket ID as fallback session

        // Process message via service
        const response = await this.chatbotService.processMessage(
            sessionId,
            data.content,
        );

        // Emit response back to client
        client.emit('response', {
            ...response,
            sessionId,
            timestamp: new Date(),
        });
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
        client.join(room);
        client.emit('joined_room', room);
    }
}
