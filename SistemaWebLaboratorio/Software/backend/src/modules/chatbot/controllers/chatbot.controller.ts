import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LabResultsInterpreterService } from '../services/lab-results-interpreter.service';
import { ChatHistoryService } from '../services/chat-history.service';
import { InterpretResultsDto, InterpretResultsResponseDto } from '../dto/interpret-results.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Chatbot')
@ApiBearerAuth()
@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
    constructor(
        private readonly labResultsInterpreter: LabResultsInterpreterService,
        private readonly chatHistory: ChatHistoryService,
    ) {}

    // =====================================================
    // INTERPRETACION DE RESULTADOS CON GEMINI
    // =====================================================

    @Post('interpret-results')
    @ApiOperation({
        summary: 'Interpretar resultados de laboratorio desde PDF',
        description: 'Recibe un PDF en base64 y usa Gemini 2.5 para interpretar los resultados',
    })
    @ApiResponse({
        status: 200,
        description: 'Interpretacion de los resultados',
        type: InterpretResultsResponseDto,
    })
    async interpretResults(
        @Body() dto: InterpretResultsDto,
        @CurrentUser('codigo_usuario') codigoUsuario: number,
    ): Promise<InterpretResultsResponseDto> {
        const mimeType = dto.mimeType || 'application/pdf';
        const sessionId = dto.sessionId || `user-${codigoUsuario}`;

        const conversacion = await this.chatHistory.getOrCreateConversacion(sessionId, codigoUsuario);

        await this.chatHistory.logMessage(conversacion.codigo_conversacion, 'USER', '[PDF subido para interpretación]');

        const interpretation = await this.labResultsInterpreter.interpretLabResults(
            dto.file,
            mimeType,
        );

        const chatMessage = await this.labResultsInterpreter.generateChatResponse(interpretation);

        await this.chatHistory.logMessage(
            conversacion.codigo_conversacion,
            'BOT',
            chatMessage,
            interpretation.success ? 'interpret_results' : 'interpret_error',
        );

        return {
            success: interpretation.success,
            chatMessage,
            data: interpretation.success ? {
                paciente: interpretation.paciente,
                fecha_examen: interpretation.fecha_examen,
                laboratorio: interpretation.laboratorio,
                resultados: interpretation.resultados,
                resumen_general: interpretation.resumen_general,
                recomendaciones: interpretation.recomendaciones,
                advertencias: interpretation.advertencias,
            } : undefined,
            error: interpretation.error,
        };
    }

    @Get('interpret-results/status')
    @ApiOperation({ summary: 'Verificar si el servicio de interpretacion esta disponible' })
    async getInterpreterStatus() {
        return {
            available: this.labResultsInterpreter.isConfigured(),
            message: this.labResultsInterpreter.isConfigured()
                ? 'Servicio de interpretacion disponible'
                : 'GEMINI_API_KEY no configurada',
            };
    }

    @Get('history')
    @ApiOperation({ summary: 'Obtener historial de chatbot del usuario autenticado' })
    async getHistory(
        @CurrentUser('codigo_usuario') codigoUsuario: number,
        @Query('sessionId') sessionId?: string,
    ) {
        const resolvedSessionId = sessionId || `user-${codigoUsuario}`;
        const messages = await this.chatHistory.getHistory(resolvedSessionId, codigoUsuario);

        return {
            sessionId: resolvedSessionId,
            messages: messages.map((message) => ({
                id: message.codigo_mensaje.toString(),
                sender: message.remitente === 'USER' ? 'user' : 'bot',
                content: message.contenido,
                intent: message.intent,
                confidence: message.confianza ? Number(message.confianza) : null,
                timestamp: message.timestamp,
            })),
        };
    }
}
