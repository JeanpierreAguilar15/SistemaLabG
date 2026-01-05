import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthLowController } from './controllers/auth-low.controller';
import { AuthService } from './services/auth.service';
import { AuthLowService } from './services/auth-low.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION') || '15m',
        },
      }),
    }),
    AuditoriaModule,
  ],
  controllers: [AuthController, AuthLowController],
  providers: [AuthService, AuthLowService, JwtStrategy, JwtRefreshStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
