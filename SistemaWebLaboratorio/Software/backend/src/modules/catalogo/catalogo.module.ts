import { Module, forwardRef } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { CatalogoAdminEventsListener } from './listeners/admin-events.listener';

@Module({
  imports: [forwardRef(() => EventsModule)],
  providers: [CatalogoAdminEventsListener],
  exports: [],
})
export class CatalogoModule {}
