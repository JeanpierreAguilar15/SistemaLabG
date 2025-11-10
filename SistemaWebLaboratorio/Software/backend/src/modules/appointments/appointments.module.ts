import { Module } from '@nestjs/common';
import { AppointmentsController, AppointmentsAdminController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AppointmentsController, AppointmentsAdminController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
