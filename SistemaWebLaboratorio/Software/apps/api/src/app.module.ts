import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { LaboratorioModule } from './modules/laboratorio/laboratorio.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { EmailModule } from './modules/notificaciones/email.module';
import { UsuarioEntity } from './modules/users/infrastructure/usuario.entity';
import { RolEntity } from './modules/users/infrastructure/rol.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    ThrottlerModule.forRoot([
      { ttl: 60, limit: 20 }, // por defecto: 20 req/min por IP
      { name: 'recuperar', ttl: 60, limit: 3 }, // endpoint de recuperación
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.POSTGRES_USER || 'labuser',
      password: process.env.POSTGRES_PASSWORD || 'labpass',
      database: process.env.POSTGRES_DB || 'labdb',
      schema: 'lab',
      autoLoadEntities: true,
      entities: [UsuarioEntity, RolEntity],
      synchronize: false,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule,
    HealthModule,
    UsersModule,
    LaboratorioModule,
    PacientesModule,
    EmailModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
