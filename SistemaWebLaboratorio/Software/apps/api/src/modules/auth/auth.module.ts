import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsuarioEntity } from '../users/infrastructure/usuario.entity';
import { AuthService } from './application/auth.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { AuthController } from './interfaces/auth.controller';
import { RestablecimientoEntity } from './infrastructure/restablecimiento.entity';
import { RolEntity } from '../users/infrastructure/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioEntity, RestablecimientoEntity, RolEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
