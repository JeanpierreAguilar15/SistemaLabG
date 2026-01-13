import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createConfigDto: CreateConfigDto, userId: number) {
    const existingConfig = await this.prisma.configuracionSistema.findUnique({
      where: { clave: createConfigDto.clave },
    });

    if (existingConfig) {
      throw new BadRequestException(`La configuración con clave '${createConfigDto.clave}' ya existe.`);
    }

    const config = await this.prisma.configuracionSistema.create({
      data: createConfigDto,
    });

    this.eventEmitter.emit('admin.config.created', {
      entityType: 'system_config',
      entityId: config.codigo_config,
      action: 'created',
      userId,
      data: config,
    });

    return config;
  }

  async findAll(isPublicOnly: boolean = false, grupo?: string) {
    const where: any = {};
    if (isPublicOnly) {
      where.es_publico = true;
    }
    if (grupo) {
      where.grupo = grupo;
    }
    return this.prisma.configuracionSistema.findMany({
      where,
      orderBy: [{ grupo: 'asc' }, { clave: 'asc' }],
    });
  }

  async findByGrupo(grupo: string) {
    return this.prisma.configuracionSistema.findMany({
      where: { grupo },
      orderBy: { clave: 'asc' },
    });
  }

  async getGrupos() {
    const configs = await this.prisma.configuracionSistema.findMany({
      select: { grupo: true },
      distinct: ['grupo'],
      orderBy: { grupo: 'asc' },
    });
    return configs.map((c) => c.grupo);
  }

  async getValue(clave: string, defaultValue?: string): Promise<string> {
    try {
      const config = await this.prisma.configuracionSistema.findUnique({
        where: { clave },
      });
      return config?.valor ?? defaultValue ?? '';
    } catch {
      return defaultValue ?? '';
    }
  }

  async getNumberValue(clave: string, defaultValue: number): Promise<number> {
    const value = await this.getValue(clave);
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Inicializar configuraciones de login por defecto
   */
  async initializeLoginDefaults() {
    const defaults = [
      {
        clave: 'LOGIN_MAX_INTENTOS',
        valor: '5',
        descripcion: 'Numero maximo de intentos de login fallidos antes de inactivar la cuenta',
        grupo: 'LOGIN',
        tipo_dato: 'NUMBER',
        es_publico: false,
      },
      {
        clave: 'LOGIN_MINUTOS_BLOQUEO',
        valor: '360',
        descripcion: 'Minutos de inactividad de cuenta despues de exceder intentos fallidos (360 = 6 horas)',
        grupo: 'LOGIN',
        tipo_dato: 'NUMBER',
        es_publico: false,
      },
      {
        clave: 'RECUPERACION_CODIGO_MINUTOS',
        valor: '5',
        descripcion: 'Minutos de validez del codigo de recuperacion de contrasena',
        grupo: 'LOGIN',
        tipo_dato: 'NUMBER',
        es_publico: false,
      },
      {
        clave: 'RECUPERACION_MAX_SOLICITUDES_HORA',
        valor: '3',
        descripcion: 'Maximo de solicitudes de recuperacion de contrasena por hora',
        grupo: 'LOGIN',
        tipo_dato: 'NUMBER',
        es_publico: false,
      },
    ];

    for (const config of defaults) {
      const existing = await this.prisma.configuracionSistema.findUnique({
        where: { clave: config.clave },
      });

      if (!existing) {
        await this.prisma.configuracionSistema.create({
          data: config,
        });
      }
    }

    return { message: 'Configuraciones de login inicializadas' };
  }

  async findOne(id: number) {
    const config = await this.prisma.configuracionSistema.findUnique({
      where: { codigo_config: id },
    });

    if (!config) {
      throw new NotFoundException(`Configuración con ID ${id} no encontrada.`);
    }

    return config;
  }

  async findByKey(key: string) {
    const config = await this.prisma.configuracionSistema.findUnique({
      where: { clave: key },
    });

    if (!config) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada.`);
    }

    return config;
  }

  async update(id: number, updateConfigDto: UpdateConfigDto, userId: number) {
    await this.findOne(id); // Verify existence

    const config = await this.prisma.configuracionSistema.update({
      where: { codigo_config: id },
      data: updateConfigDto,
    });

    this.eventEmitter.emit('admin.config.updated', {
      entityType: 'system_config',
      entityId: config.codigo_config,
      action: 'updated',
      userId,
      data: { ...config, changes: updateConfigDto },
    });

    return config;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id); // Verify existence

    const config = await this.prisma.configuracionSistema.delete({
      where: { codigo_config: id },
    });

    this.eventEmitter.emit('admin.config.deleted', {
      entityType: 'system_config',
      entityId: config.codigo_config,
      action: 'deleted',
      userId,
      data: config,
    });

    return config;
  }

  async getPublicConfig() {
    const configs = await this.prisma.configuracionSistema.findMany({
      where: { es_publico: true },
    });

    // Transform array to object for easier consumption by frontend
    return configs.reduce((acc, curr) => {
      acc[curr.clave] = this.parseValue(curr.valor, curr.tipo_dato);
      return acc;
    }, {});
  }

  private parseValue(value: string, type: string) {
    switch (type) {
      case 'NUMBER':
        return Number(value);
      case 'BOOLEAN':
        return value === 'true';
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }
}