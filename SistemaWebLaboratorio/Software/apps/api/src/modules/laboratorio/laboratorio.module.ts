import { Module } from '@nestjs/common';
import { LaboratorioController } from './laboratorio.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [LaboratorioController],
  providers: [RolesGuard],
})
export class LaboratorioModule {}

