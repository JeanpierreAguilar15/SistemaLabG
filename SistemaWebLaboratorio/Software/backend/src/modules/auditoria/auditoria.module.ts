import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { AdminEventsListener } from './listeners/admin-events.listener';
import { SecurityLoggingService } from './services/security-logging.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [],
  providers: [AdminEventsListener, SecurityLoggingService],
  exports: [SecurityLoggingService],
})
export class AuditoriaModule {}
