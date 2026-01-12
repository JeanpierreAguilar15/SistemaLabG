import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase no permitido en producción');
    }

    // Orden de eliminación respetando foreign keys
    await this.pago.deleteMany();
    await this.reserva.deleteMany();
    await this.horarioCancha.deleteMany();
    await this.cancha.deleteMany();
    await this.usuario.deleteMany();
  }
}
