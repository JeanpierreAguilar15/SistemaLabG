import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
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
      if (existing.codigo_paciente && codigoPaciente && existing.codigo_paciente !== codigoPaciente) {
        throw new ForbiddenException('La conversación no pertenece al usuario autenticado');
      }

      const updated = await this.prisma.conversacionChatbot.update({
        where: { codigo_conversacion: existing.codigo_conversacion },
        data: {
          fecha_ultimo_msg: new Date(),
          codigo_paciente: existing.codigo_paciente || codigoPaciente || null,
        },
      });
      return updated;
    }

    return this.prisma.conversacionChatbot.create({
      data: {
        session_id: sessionId,
        codigo_paciente: codigoPaciente || null,
      },
    });
  }

  async getHistory(sessionId: string, codigoPaciente: number) {
    const conversacion = await this.prisma.conversacionChatbot.findUnique({
      where: { session_id: sessionId },
      include: {
        mensajes: {
          orderBy: { timestamp: 'asc' },
          select: {
            codigo_mensaje: true,
            remitente: true,
            contenido: true,
            intent: true,
            confianza: true,
            timestamp: true,
          },
        },
      },
    });

    if (!conversacion) {
      return [];
    }

    if (conversacion.codigo_paciente !== codigoPaciente) {
      throw new ForbiddenException('La conversación no pertenece al usuario autenticado');
    }

    return conversacion.mensajes;
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
