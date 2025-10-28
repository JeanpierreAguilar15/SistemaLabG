import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ResultsModule } from './modules/results/results.module';
import { BillingModule } from './modules/billing/billing.module';
import { AuditModule } from './modules/audit/audit.module';
import { ProfileModule } from './modules/profile/profile.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    AppointmentsModule,
    ResultsModule,
    BillingModule,
    AuditModule,
    ProfileModule,
  ],
})
export class AppModule {}
