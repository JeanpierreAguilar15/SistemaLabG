import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LabResultsInterpreterService } from '../services/lab-results-interpreter.service';
import { ChatHistoryService } from '../services/chat-history.service';
import { InterpretResultsDto, InterpretResultsResponseDto } from '../dto/interpret-results.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
    constructor(
        private readonly labResultsInterpreter: LabResultsInterpreterService,
        private readonly chatHistory: ChatHistoryService,
    ) {}

    // =====================================================
    // INTERPRETACION DE RESULTADOS CON GEMINI
    // =====================================================

    @Public()
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
    async interpretResults(@Body() dto: InterpretResultsDto): Promise<InterpretResultsResponseDto> {
        const mimeType = dto.mimeType || 'application/pdf';
        const sessionId = dto.sessionId || `anon-${Date.now()}`;

        const conversacion = await this.chatHistory.getOrCreateConversacion(sessionId);

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
}
