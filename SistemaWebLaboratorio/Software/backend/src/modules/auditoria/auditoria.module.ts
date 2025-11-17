import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminEventsListener } from './listeners/admin-events.listener';

@Module({
  imports: [PrismaModule],
  providers: [AdminEventsListener],
  exports: [],
})
export class AuditoriaModule {}
