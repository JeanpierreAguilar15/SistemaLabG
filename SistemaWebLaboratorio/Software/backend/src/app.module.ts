import { Module } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ResultsModule } from './modules/results/results.module';
import { BillingModule } from './modules/billing/billing.module';
import { AuditModule } from './modules/audit/audit.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AdminModule } from './modules/admin/admin.module';
import { CatalogModule } from './modules/catalog/catalog.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    AppointmentsModule,
    ResultsModule,
    BillingModule,
    AuditModule,
    ProfileModule,
    AdminModule,
    CatalogModule,
  ],
  providers: [GlobalExceptionFilter],
})
export class AppModule {}
