import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from '../../common/crypto/password.service';
import { AuditModule } from '../audit/audit.module';
import { JwtSvc } from './services/jwt.service';
import { EmailService } from '../../common/mail/email.service';

@Module({
  imports: [AuditModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtSvc, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
