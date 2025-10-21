import { Module } from '@nestjs/common';
import { PacientesController } from './pacientes.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [PacientesController],
  providers: [RolesGuard],
})
export class PacientesModule {}

