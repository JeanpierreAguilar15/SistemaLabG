import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const body = request.body;
    const params = request.params;
    const requestId = uuidv4();
    const startTime = Date.now();

    // Skip GET requests for audit logging unless specifically marked
    if (method === 'GET') {
      return next.handle();
    }

    // Extraer información de la URL
    const { entidad, codigoEntidad, accionDescriptiva } = this.parseUrl(url, method);

    return next.handle().pipe(
      tap(async (data) => {
        const duration = Date.now() - startTime;

        try {
          if (user) {
            // Construir descripción detallada
            const descripcion = this.buildDescription(method, entidad, body, data);

            await this.prisma.logActividad.create({
              data: {
                codigo_usuario: user.codigo_usuario,
                accion: accionDescriptiva,
                entidad: entidad,
                codigo_entidad: codigoEntidad ? parseInt(codigoEntidad) : (data?.codigo || data?.id || null),
                descripcion: descripcion,
                ip_address: this.getClientIp(request),
                user_agent: request.headers['user-agent']?.substring(0, 255),
                datos_anteriores: body ? this.sanitizeBody(body) : null,
                datos_nuevos: data ? this.sanitizeBody(data) : null,
                fecha_accion: new Date(),
              },
            });

            this.logger.debug(
              `Audit: ${accionDescriptiva} | User: ${user.codigo_usuario} | Entity: ${entidad} | Duration: ${duration}ms`
            );
          }
        } catch (error) {
          this.logger.error(`Failed to log audit for request ${requestId}`, error.stack);
        }
      }),
    );
  }

  /**
   * Parsea la URL para extraer entidad y código
   */
  private parseUrl(url: string, method: string): { entidad: string; codigoEntidad: string | null; accionDescriptiva: string } {
    // Remover query params
    const cleanUrl = url.split('?')[0];
    // Remover prefijo /api/v1
    const pathWithoutPrefix = cleanUrl.replace(/^\/api\/v\d+\//, '');
    const parts = pathWithoutPrefix.split('/').filter(Boolean);

    let entidad = 'Sistema';
    let codigoEntidad: string | null = null;
    let accion = '';

    // Mapeo de métodos HTTP a acciones
    const metodosAccion: Record<string, string> = {
      'POST': 'CREAR',
      'PUT': 'ACTUALIZAR',
      'PATCH': 'ACTUALIZAR',
      'DELETE': 'ELIMINAR',
    };

    if (parts.length > 0) {
      // Primera parte es la entidad principal
      entidad = this.normalizeEntityName(parts[0]);
    }

    if (parts.length > 1) {
      // Verificar si es un número (código)
      if (/^\d+$/.test(parts[1])) {
        codigoEntidad = parts[1];
      } else {
        // Es una sub-acción como /admin o /my
        if (parts[1] === 'admin') {
          entidad = `${entidad} (Admin)`;
        }
      }
    }

    // Buscar código en partes posteriores
    if (!codigoEntidad && parts.length > 2) {
      const possibleId = parts[2];
      if (/^\d+$/.test(possibleId)) {
        codigoEntidad = possibleId;
      }
    }

    // Detectar acciones especiales
    const lastPart = parts[parts.length - 1]?.toLowerCase();
    const accionesEspeciales: Record<string, string> = {
      'cancel': 'CANCELAR',
      'confirm': 'CONFIRMAR',
      'reschedule': 'REPROGRAMAR',
      'validate': 'VALIDAR',
      'approve': 'APROBAR',
      'reject': 'RECHAZAR',
      'toggle-status': 'CAMBIAR_ESTADO',
      'upload-pdf': 'SUBIR_PDF',
      'emit': 'EMITIR',
      'receive': 'RECIBIR',
    };

    if (accionesEspeciales[lastPart]) {
      accion = accionesEspeciales[lastPart];
    } else {
      accion = metodosAccion[method] || method;
    }

    return {
      entidad,
      codigoEntidad,
      accionDescriptiva: `${accion}_${entidad.toUpperCase().replace(/\s+/g, '_')}`,
    };
  }

  /**
   * Normaliza el nombre de la entidad
   */
  private normalizeEntityName(name: string): string {
    const mappings: Record<string, string> = {
      'auth': 'Autenticacion',
      'users': 'Usuario',
      'agenda': 'Agenda',
      'citas': 'Cita',
      'slots': 'Slot',
      'cotizaciones': 'Cotizacion',
      'pagos': 'Pago',
      'examenes': 'Examen',
      'resultados': 'Resultado',
      'inventario': 'Inventario',
      'inventory': 'Inventario',
      'items': 'Item',
      'movements': 'Movimiento',
      'suppliers': 'Proveedor',
      'purchase-orders': 'OrdenCompra',
      'chatbot': 'Chatbot',
      'admin': 'Administracion',
      'feriados': 'Feriado',
      'sedes': 'Sede',
      'servicios': 'Servicio',
      'paquetes': 'Paquete',
      'categorias': 'Categoria',
    };

    return mappings[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Construye una descripción legible de la operación
   */
  private buildDescription(method: string, entidad: string, body: any, response: any): string {
    const descripciones: Record<string, string> = {
      'POST': `Se creó un nuevo registro en ${entidad}`,
      'PUT': `Se actualizó un registro en ${entidad}`,
      'PATCH': `Se modificó parcialmente un registro en ${entidad}`,
      'DELETE': `Se eliminó un registro de ${entidad}`,
    };

    let descripcion = descripciones[method] || `Operación ${method} en ${entidad}`;

    // Agregar detalles específicos
    if (response?.numero_cotizacion) {
      descripcion += ` (Cotización: ${response.numero_cotizacion})`;
    }
    if (response?.numero_pago) {
      descripcion += ` (Pago: ${response.numero_pago})`;
    }
    if (response?.codigo_cita) {
      descripcion += ` (Cita: ${response.codigo_cita})`;
    }
    if (body?.estado) {
      descripcion += ` - Nuevo estado: ${body.estado}`;
    }

    return descripcion;
  }

  /**
   * Obtiene la IP real del cliente
   */
  private getClientIp(request: any): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  /**
   * Sanitiza datos sensibles
   */
  private sanitizeBody(body: any): any {
    if (!body) return null;
    if (typeof body !== 'object') return body;

    const sanitized = Array.isArray(body) ? [...body] : { ...body };
    const sensitiveFields = [
      'password', 'contrasena', 'token', 'accessToken', 'refreshToken',
      'creditCard', 'cvv', 'cardNumber', 'secret', 'apiKey',
    ];

    const sanitizeRecursive = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitizeRecursive(obj[key]);
        }
      }
      return obj;
    };

    return sanitizeRecursive(sanitized);
  }
}