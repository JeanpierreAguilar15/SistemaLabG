import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DialogflowWebhookController } from './dialogflow-webhook.controller';
import { DialogflowWebhookService } from './dialogflow-webhook.service';

@Module({
  imports: [PrismaModule],
  controllers: [DialogflowWebhookController],
  providers: [DialogflowWebhookService],
  exports: [DialogflowWebhookService],
})
export class DialogflowWebhookModule {}
