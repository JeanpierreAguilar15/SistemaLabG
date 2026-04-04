import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { LabResultsInterpreterService } from './services/lab-results-interpreter.service';
import { ChatHistoryService } from './services/chat-history.service';
import { ChatbotController } from './controllers/chatbot.controller';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
    ],
    controllers: [ChatbotController],
    providers: [
        LabResultsInterpreterService,
        ChatHistoryService,
    ],
    exports: [LabResultsInterpreterService, ChatHistoryService],
})
export class ChatbotModule { }
