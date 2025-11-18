import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AdminEventsListener } from './listeners/admin-events.listener';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EventsModule),
  ],
  providers: [AdminEventsListener],
  exports: [],
})
export class AuditoriaModule {}
