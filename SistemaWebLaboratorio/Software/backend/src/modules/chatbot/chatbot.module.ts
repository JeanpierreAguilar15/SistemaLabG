import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatbotService } from './services/chatbot.service';
import { ChatbotLoggingService } from './services/chatbot-logging.service';
import { ChatbotController } from './controllers/chatbot.controller';
import { ChatbotLoggingController } from './controllers/chatbot-logging.controller';
import { ChatGateway } from './gateways/chat.gateway';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [ChatbotController, ChatbotLoggingController],
    providers: [ChatbotService, ChatbotLoggingService, ChatGateway],
    exports: [ChatbotService, ChatbotLoggingService],
})
export class ChatbotModule { }
