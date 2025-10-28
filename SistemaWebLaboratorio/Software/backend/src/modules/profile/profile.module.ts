import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AuditModule } from '../audit/audit.module';
import { PasswordService } from '../../common/crypto/password.service';

@Module({
  imports: [AuditModule],
  controllers: [ProfileController],
  providers: [ProfileService, PasswordService],
})
export class ProfileModule {}

