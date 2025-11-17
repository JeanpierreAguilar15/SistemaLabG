import { Module } from '@nestjs/common';
import { CatalogoAdminEventsListener } from './listeners/admin-events.listener';

@Module({
  imports: [],
  providers: [CatalogoAdminEventsListener],
  exports: [],
})
export class CatalogoModule {}
