import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ConfiguracionDefecto {
  clave: string;
  valor: string;
  descripcion: string;
  grupo: string;
  tipo_dato: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  es_publico: boolean;
}

/**
 * Configuraciones por defecto del sistema
 */
const CONFIGURACIONES_DEFECTO: ConfiguracionDefecto[] = [
  // Autenticación
  {
    clave: 'AUTH_MAX_INTENTOS_LOGIN',
    valor: '5',
    descripcion: 'Número máximo de intentos de login antes de bloquear la cuenta',
    grupo: 'AUTENTICACION',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  {
    clave: 'AUTH_TIEMPO_BLOQUEO_MINUTOS',
    valor: '30',
    descripcion: 'Tiempo en minutos que una cuenta permanece bloqueada',
    grupo: 'AUTENTICACION',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  {
    clave: 'AUTH_JWT_ACCESS_EXPIRATION',
    valor: '15m',
    descripcion: 'Tiempo de expiración del token de acceso (ej: 15m, 1h)',
    grupo: 'AUTENTICACION',
    tipo_dato: 'STRING',
    es_publico: false,
  },
  {
    clave: 'AUTH_JWT_REFRESH_EXPIRATION',
    valor: '7d',
    descripcion: 'Tiempo de expiración del token de actualización',
    grupo: 'AUTENTICACION',
    tipo_dato: 'STRING',
    es_publico: false,
  },
  {
    clave: 'AUTH_BCRYPT_SALT_ROUNDS',
    valor: '10',
    descripcion: 'Número de rondas para el hash bcrypt',
    grupo: 'AUTENTICACION',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  // Agenda y Citas
  {
    clave: 'AGENDA_TIEMPO_MINIMO_SLOT_MINUTOS',
    valor: '10',
    descripcion: 'Duración mínima de un slot de cita en minutos',
    grupo: 'AGENDA',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  {
    clave: 'AGENDA_DIAS_ANTICIPACION_MAXIMA',
    valor: '60',
    descripcion: 'Días máximos de anticipación para agendar una cita',
    grupo: 'AGENDA',
    tipo_dato: 'NUMBER',
    es_publico: true,
  },
  {
    clave: 'AGENDA_HORAS_CANCELACION_MINIMA',
    valor: '24',
    descripcion: 'Horas mínimas antes de la cita para poder cancelar',
    grupo: 'AGENDA',
    tipo_dato: 'NUMBER',
    es_publico: true,
  },
  // Cotizaciones y Pagos
  {
    clave: 'COTIZACION_DIAS_VIGENCIA',
    valor: '30',
    descripcion: 'Días de vigencia de una cotización',
    grupo: 'PAGOS',
    tipo_dato: 'NUMBER',
    es_publico: true,
  },
  {
    clave: 'COTIZACION_MAX_EXAMENES',
    valor: '50',
    descripcion: 'Número máximo de exámenes por cotización',
    grupo: 'PAGOS',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  {
    clave: 'PAGOS_DESCUENTO_MAXIMO',
    valor: '50',
    descripcion: 'Descuento máximo permitido en porcentaje',
    grupo: 'PAGOS',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  // Resultados
  {
    clave: 'RESULTADOS_DIAS_DISPONIBILIDAD',
    valor: '90',
    descripcion: 'Días que los resultados están disponibles para descarga',
    grupo: 'RESULTADOS',
    tipo_dato: 'NUMBER',
    es_publico: true,
  },
  {
    clave: 'RESULTADOS_TAMAÑO_MAX_PDF_MB',
    valor: '10',
    descripcion: 'Tamaño máximo del archivo PDF en MB',
    grupo: 'RESULTADOS',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  // Inventario
  {
    clave: 'INVENTARIO_STOCK_MINIMO_ALERTA',
    valor: '10',
    descripcion: 'Cantidad mínima de stock antes de generar alerta',
    grupo: 'INVENTARIO',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  {
    clave: 'INVENTARIO_DIAS_VENCIMIENTO_ALERTA',
    valor: '30',
    descripcion: 'Días antes del vencimiento para generar alerta',
    grupo: 'INVENTARIO',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
  // General
  {
    clave: 'SISTEMA_NOMBRE',
    valor: 'Sistema de Laboratorio',
    descripcion: 'Nombre del sistema que aparece en la interfaz',
    grupo: 'GENERAL',
    tipo_dato: 'STRING',
    es_publico: true,
  },
  {
    clave: 'SISTEMA_EMAIL_CONTACTO',
    valor: 'contacto@laboratorio.com',
    descripcion: 'Email de contacto del laboratorio',
    grupo: 'GENERAL',
    tipo_dato: 'STRING',
    es_publico: true,
  },
  {
    clave: 'SISTEMA_TELEFONO_CONTACTO',
    valor: '+593999999999',
    descripcion: 'Teléfono de contacto del laboratorio',
    grupo: 'GENERAL',
    tipo_dato: 'STRING',
    es_publico: true,
  },
  {
    clave: 'SISTEMA_MONEDA',
    valor: 'USD',
    descripcion: 'Código de moneda (USD, PEN, etc.)',
    grupo: 'GENERAL',
    tipo_dato: 'STRING',
    es_publico: true,
  },
  {
    clave: 'SISTEMA_SIMBOLO_MONEDA',
    valor: '$',
    descripcion: 'Símbolo de moneda para mostrar',
    grupo: 'GENERAL',
    tipo_dato: 'STRING',
    es_publico: true,
  },
  // Notificaciones
  {
    clave: 'NOTIFICACIONES_EMAIL_ACTIVO',
    valor: 'true',
    descripcion: 'Activar envío de notificaciones por email',
    grupo: 'NOTIFICACIONES',
    tipo_dato: 'BOOLEAN',
    es_publico: false,
  },
  {
    clave: 'NOTIFICACIONES_RECORDATORIO_HORAS',
    valor: '24',
    descripcion: 'Horas antes de la cita para enviar recordatorio',
    grupo: 'NOTIFICACIONES',
    tipo_dato: 'NUMBER',
    es_publico: false,
  },
];

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name);
  private cache: Map<string, any> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minuto

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.inicializarConfiguraciones();
  }

  /**
   * Inicializa las configuraciones por defecto si no existen
   */
  private async inicializarConfiguraciones() {
    this.logger.log('Inicializando configuraciones del sistema...');

    for (const config of CONFIGURACIONES_DEFECTO) {
      const existe = await this.prisma.configuracionSistema.findFirst({
        where: { clave: config.clave },
      });

      if (!existe) {
        await this.prisma.configuracionSistema.create({
          data: config,
        });
        this.logger.debug(`Configuración creada: ${config.clave}`);
      }
    }

    this.logger.log('Configuraciones inicializadas correctamente');
    await this.refrescarCache();
  }

  /**
   * Refresca el cache de configuraciones
   */
  private async refrescarCache() {
    const configuraciones = await this.prisma.configuracionSistema.findMany();
    this.cache.clear();

    for (const config of configuraciones) {
      this.cache.set(config.clave, this.parseValue(config.valor, config.tipo_dato));
    }

    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;
  }

  /**
   * Obtiene una configuración por clave con cache
   */
  async get<T = any>(clave: string, valorDefecto?: T): Promise<T> {
    if (Date.now() > this.cacheExpiry) {
      await this.refrescarCache();
    }

    if (this.cache.has(clave)) {
      return this.cache.get(clave) as T;
    }

    const config = await this.prisma.configuracionSistema.findFirst({
      where: { clave },
    });

    if (config) {
      const valor = this.parseValue(config.valor, config.tipo_dato);
      this.cache.set(clave, valor);
      return valor as T;
    }

    return valorDefecto as T;
  }

  /**
   * Obtiene una configuración numérica
   */
  async getNumber(clave: string, valorDefecto: number = 0): Promise<number> {
    const valor = await this.get<number>(clave, valorDefecto);
    return typeof valor === 'number' ? valor : valorDefecto;
  }

  /**
   * Obtiene una configuración booleana
   */
  async getBoolean(clave: string, valorDefecto: boolean = false): Promise<boolean> {
    const valor = await this.get<boolean>(clave, valorDefecto);
    return typeof valor === 'boolean' ? valor : valorDefecto;
  }

  /**
   * Obtiene una configuración de texto
   */
  async getString(clave: string, valorDefecto: string = ''): Promise<string> {
    const valor = await this.get<string>(clave, valorDefecto);
    return typeof valor === 'string' ? valor : valorDefecto;
  }

  /**
   * Invalida el cache
   */
  invalidarCache() {
    this.cacheExpiry = 0;
    this.cache.clear();
  }

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

  async findAll(isPublicOnly: boolean = false) {
    const where = isPublicOnly ? { es_publico: true } : {};
    return this.prisma.configuracionSistema.findMany({
      where,
      orderBy: { grupo: 'asc' },
    });
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