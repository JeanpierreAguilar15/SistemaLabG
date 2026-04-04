import { Module } from '@nestjs/common';
import { CatalogoAdminEventsListener } from './listeners/admin-events.listener';
import { CatalogoController } from './catalogo.controller';
import { CatalogoService } from './catalogo.service';

@Module({
  imports: [],
  controllers: [CatalogoController],
  providers: [CatalogoService, CatalogoAdminEventsListener],
  exports: [CatalogoService],
})
export class CatalogoModule {}
