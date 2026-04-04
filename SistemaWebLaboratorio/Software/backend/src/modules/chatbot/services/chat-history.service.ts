import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversacion(sessionId: string, codigoPaciente?: number) {
    const existing = await this.prisma.conversacionChatbot.findUnique({
      where: { session_id: sessionId },
    });

    if (existing) {
      await this.prisma.conversacionChatbot.update({
        where: { codigo_conversacion: existing.codigo_conversacion },
        data: { fecha_ultimo_msg: new Date() },
      });
      return existing;
    }

    return this.prisma.conversacionChatbot.create({
      data: {
        session_id: sessionId,
        codigo_paciente: codigoPaciente || null,
      },
    });
  }

  async logMessage(
    codigoConversacion: number,
    remitente: 'USER' | 'BOT',
    contenido: string,
    intent?: string,
    confianza?: number,
  ) {
    try {
      await this.prisma.mensajeChatbot.create({
        data: {
          codigo_conversacion: codigoConversacion,
          remitente,
          contenido,
          intent: intent || null,
          confianza: confianza || null,
        },
      });
    } catch (error) {
      this.logger.warn(`Error guardando mensaje chatbot: ${error.message}`);
    }
  }
}
