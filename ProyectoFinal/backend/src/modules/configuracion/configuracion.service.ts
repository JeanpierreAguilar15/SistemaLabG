import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface ConfiguracionSistema {
  rateLimitTtl: number;        // Time window in seconds
  rateLimitMax: number;        // Max requests per window
  loginRateLimitTtl: number;   // Time window for login
  loginRateLimitMax: number;   // Max login attempts
  cancelacionMinHoras: number; // Minimum hours before to cancel
  enabled: boolean;
}

const DEFAULT_CONFIG: ConfiguracionSistema = {
  rateLimitTtl: 60,           // 1 minute
  rateLimitMax: 100,          // 100 requests per minute
  loginRateLimitTtl: 300,     // 5 minutes
  loginRateLimitMax: 5,       // 5 login attempts per 5 minutes
  cancelacionMinHoras: 24,    // 24 hours before
  enabled: true,
};

@Injectable()
export class ConfiguracionService {
  private config: ConfiguracionSistema = { ...DEFAULT_CONFIG };

  constructor(private readonly prisma: PrismaService) {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const configs = await this.prisma.$queryRaw<any[]>`
        SELECT clave, valor FROM configuracion_sistema
      `;

      configs.forEach((c: any) => {
        if (c.clave in this.config) {
          const value = c.valor;
          if (typeof this.config[c.clave as keyof ConfiguracionSistema] === 'number') {
            (this.config as any)[c.clave] = parseInt(value, 10);
          } else if (typeof this.config[c.clave as keyof ConfiguracionSistema] === 'boolean') {
            (this.config as any)[c.clave] = value === 'true';
          } else {
            (this.config as any)[c.clave] = value;
          }
        }
      });
    } catch (error) {
      // Table might not exist yet, use defaults
      console.log('Using default configuration');
    }
  }

  getConfig(): ConfiguracionSistema {
    return { ...this.config };
  }

  getRateLimitConfig() {
    return {
      ttl: this.config.rateLimitTtl * 1000, // Convert to milliseconds
      limit: this.config.rateLimitMax,
    };
  }

  getLoginRateLimitConfig() {
    return {
      ttl: this.config.loginRateLimitTtl * 1000,
      limit: this.config.loginRateLimitMax,
    };
  }

  getCancelacionMinHoras(): number {
    return this.config.cancelacionMinHoras;
  }

  isRateLimitEnabled(): boolean {
    return this.config.enabled;
  }

  async updateConfig(updates: Partial<ConfiguracionSistema>): Promise<ConfiguracionSistema> {
    // Update in-memory config
    Object.assign(this.config, updates);

    // Persist changes to database
    try {
      for (const [key, value] of Object.entries(updates)) {
        await this.prisma.$executeRaw`
          INSERT INTO configuracion_sistema (clave, valor)
          VALUES (${key}, ${String(value)})
          ON CONFLICT (clave) DO UPDATE SET valor = ${String(value)}
        `;
      }
    } catch (error) {
      console.error('Error persisting configuration:', error);
    }

    return this.getConfig();
  }

  async getAllConfigForAdmin(): Promise<any> {
    return {
      rateLimit: {
        enabled: this.config.enabled,
        general: {
          ttl: this.config.rateLimitTtl,
          max: this.config.rateLimitMax,
          descripcion: `${this.config.rateLimitMax} solicitudes por ${this.config.rateLimitTtl} segundos`,
        },
        login: {
          ttl: this.config.loginRateLimitTtl,
          max: this.config.loginRateLimitMax,
          descripcion: `${this.config.loginRateLimitMax} intentos de login por ${this.config.loginRateLimitTtl / 60} minutos`,
        },
      },
      reservas: {
        cancelacionMinHoras: this.config.cancelacionMinHoras,
        descripcion: `Las reservas deben cancelarse con al menos ${this.config.cancelacionMinHoras} horas de anticipacion`,
      },
    };
  }
}
