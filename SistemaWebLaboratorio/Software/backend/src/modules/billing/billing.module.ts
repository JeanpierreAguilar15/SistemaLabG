import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AuditModule } from '../audit/audit.module';
import { BillingAdminController } from './billing.admin.controller';

@Module({
  imports: [AuditModule],
  controllers: [BillingController, BillingAdminController],
  providers: [BillingService],
})
export class BillingModule {}
