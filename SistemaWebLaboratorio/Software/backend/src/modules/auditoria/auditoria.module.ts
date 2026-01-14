import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AdminEventsListener } from './listeners/admin-events.listener';
import { SecurityLoggingService } from './services/security-logging.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [],
  providers: [AdminEventsListener, SecurityLoggingService],
  exports: [SecurityLoggingService],
})
export class AuditoriaModule {}
