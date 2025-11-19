import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminEventPayload } from '../../admin/admin-events.service';
import { EventsGateway } from '../../events/events.gateway';

/**
 * Listener que registra todos los eventos administrativos en la tabla de auditoría
 * Proporciona trazabilidad completa de todas las acciones admin
 * También emite notificaciones en tiempo real vía WebSocket
 */
@Injectable()
export class AdminEventsListener {
  private readonly logger = new Logger(AdminEventsListener.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Escucha TODOS los eventos admin usando wildcard
   * Se ejecuta para cada evento emitido desde AdminService
   */
  @OnEvent('admin.*', { async: true })
  async handleAdminEvent(payload: AdminEventPayload & { eventType: string }) {
    try {
      // Registrar en log de actividad
      await this.prisma.logActividad.create({
        data: {
          codigo_usuario: payload.userId,
          accion: this.getActionDescription(payload),
          entidad: payload.entityType,
          codigo_entidad: payload.entityId,
          descripcion: this.getDetailedDescription(payload),
          datos_nuevos: payload.data || {},
          ip_address: null, // TODO: Obtener del request
          user_agent: null, // TODO: Obtener del request
          fecha_accion: payload.timestamp,
        },
      });

      this.logger.log(
        `📝 Audit logged: ${payload.entityType}.${payload.action} by user ${payload.userId}`,
      );

      // Emitir notificación en tiempo real a admins
      this.eventsGateway.notifyAdminEvent({
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId,
        action: payload.action,
        userId: payload.userId,
        data: payload.data,
      });
    } catch (error) {
      this.logger.error(`Failed to log admin event: ${error.message}`, error.stack);

      // Registrar error en log de errores
      await this.prisma.logError.create({
        data: {
          nivel: 'ERROR',
          mensaje: `Failed to log admin event: ${payload.entityType}.${payload.action}`,
          stack_trace: error.stack,
          endpoint: `admin.${payload.entityType}.${payload.action}`,
          metodo: 'EVENT',
          ip_address: null,
          user_agent: null,
          codigo_usuario: payload.userId,
        },
      }).catch(err => {
        this.logger.error(`Failed to log error: ${err.message}`);
      });
    }
  }

  /**
   * Listeners específicos para acciones críticas
   */

  @OnEvent('admin.user.deleted')
  async handleUserDeleted(payload: AdminEventPayload) {
    this.logger.warn(
      `⚠️  USER DELETED: User ${payload.entityId} was soft-deleted by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.role.deleted')
  async handleRoleDeleted(payload: AdminEventPayload) {
    this.logger.warn(
      `⚠️  ROLE DELETED: Role ${payload.entityId} was deleted by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.exam.created')
  async handleExamCreated(payload: AdminEventPayload) {
    this.logger.log(
      `✅ NEW EXAM: Exam ${payload.entityId} created by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.price.updated')
  async handlePriceUpdated(payload: AdminEventPayload) {
    this.logger.log(
      `💰 PRICE CHANGE: Price ${payload.entityId} updated by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.inventory.deleted')
  async handleInventoryDeleted(payload: AdminEventPayload) {
    this.logger.warn(
      `📦 INVENTORY DELETED: Item ${payload.entityId} was deactivated by admin ${payload.userId}`,
    );
  }

  /**
   * Genera descripción legible de la acción para auditoría
   */
  private getActionDescription(payload: AdminEventPayload & { eventType?: string }): string {
    const entity = this.capitalizeFirst(payload.entityType.replace('_', ' '));
    const action = payload.action;

    switch (action) {
      case 'created':
        return `Creó ${entity}`;
      case 'updated':
        return `Actualizó ${entity}`;
      case 'deleted':
        return `Eliminó ${entity}`;
      default:
        return `Acción en ${entity}`;
    }
  }

  /**
   * Genera descripción detallada y legible de la acción con datos específicos
   */
  private getDetailedDescription(payload: AdminEventPayload & { eventType?: string }): string {
    const action = payload.action;
    const data = payload.data || {};
    const entityId = payload.entityId;

    // Descripciones específicas por tipo de entidad
    switch (payload.entityType) {
      case 'user':
        return this.getUserDescription(action, entityId, data);
      case 'role':
        return this.getRoleDescription(action, entityId, data);
      case 'service':
        return this.getServiceDescription(action, entityId, data);
      case 'location':
        return this.getLocationDescription(action, entityId, data);
      case 'exam':
        return this.getExamDescription(action, entityId, data);
      case 'exam_category':
        return this.getExamCategoryDescription(action, entityId, data);
      case 'package':
        return this.getPackageDescription(action, entityId, data);
      case 'inventory':
        return this.getInventoryDescription(action, entityId, data);
      case 'supplier':
        return this.getSupplierDescription(action, entityId, data);
      case 'batch':
        return this.getBatchDescription(action, entityId, data);
      case 'movement':
        return this.getMovementDescription(action, entityId, data);
      case 'purchase_order':
        return this.getPurchaseOrderDescription(action, entityId, data);
      default:
        return this.getActionDescription(payload);
    }
  }

  // Descripciones específicas por entidad
  private getUserDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó usuario ${data.nombres || ''} ${data.apellidos || ''} (Cédula: ${data.cedula || 'N/A'})`;
      case 'updated':
        return `Actualizó datos del usuario ID ${id}${data.nombres ? ` - ${data.nombres} ${data.apellidos}` : ''}`;
      case 'deleted':
        return `Desactivó usuario ID ${id}`;
      case 'password_reset':
        return `Restableció contraseña del usuario ID ${id}`;
      case 'role_changed':
        return `Cambió rol del usuario ID ${id} a ${data.nuevo_rol || 'N/A'}`;
      default:
        return `Acción en usuario ID ${id}`;
    }
  }

  private getRoleDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó rol "${data.nombre || 'N/A'}" con nivel de acceso ${data.nivel_acceso || 'N/A'}`;
      case 'updated':
        return `Actualizó rol ID ${id}${data.nombre ? ` - "${data.nombre}"` : ''}`;
      case 'deleted':
        return `Eliminó rol ID ${id}`;
      default:
        return `Acción en rol ID ${id}`;
    }
  }

  private getServiceDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó servicio "${data.nombre || 'N/A'}"`;
      case 'updated':
        return `Actualizó servicio ID ${id}${data.nombre ? ` - "${data.nombre}"` : ''}`;
      case 'deleted':
        return `Desactivó servicio ID ${id}`;
      default:
        return `Acción en servicio ID ${id}`;
    }
  }

  private getLocationDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó sede "${data.nombre || 'N/A'}" en ${data.direccion || 'N/A'}`;
      case 'updated':
        return `Actualizó sede ID ${id}${data.nombre ? ` - "${data.nombre}"` : ''}`;
      case 'deleted':
        return `Desactivó sede ID ${id}`;
      default:
        return `Acción en sede ID ${id}`;
    }
  }

  private getExamDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó examen "${data.nombre || 'N/A'}" (Código: ${data.codigo_interno || 'N/A'})`;
      case 'updated':
        return `Actualizó examen ID ${id}${data.nombre ? ` - "${data.nombre}"` : ''}`;
      case 'deleted':
        return `Desactivó examen ID ${id}`;
      default:
        return `Acción en examen ID ${id}`;
    }
  }

  private getExamCategoryDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó categoría de examen "${data.nombre || 'N/A'}"`;
      case 'updated':
        return `Actualizó categoría ID ${id}${data.nombre ? ` - "${data.nombre}"` : ''}`;
      case 'deleted':
        return `Desactivó categoría ID ${id}`;
      default:
        return `Acción en categoría ID ${id}`;
    }
  }

  private getPackageDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó paquete "${data.nombre || 'N/A'}" con ${data.num_examenes || 0} exámenes`;
      case 'updated':
        return `Actualizó paquete ID ${id}${data.nombre ? ` - "${data.nombre}"` : ''}`;
      case 'deleted':
        return `Desactivó paquete ID ${id}`;
      default:
        return `Acción en paquete ID ${id}`;
    }
  }

  private getInventoryDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó item de inventario "${data.nombre || 'N/A'}" (Código: ${data.codigo_interno || 'N/A'})`;
      case 'updated':
        return `Actualizó item ID ${id}${data.nombre ? ` - "${data.nombre}"` : ''}${data.stock_actual !== undefined ? ` - Stock: ${data.stock_actual}` : ''}`;
      case 'deleted':
        return `Desactivó item de inventario ID ${id}`;
      default:
        return `Acción en item ID ${id}`;
    }
  }

  private getSupplierDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó proveedor "${data.razon_social || 'N/A'}" (RUC: ${data.ruc || 'N/A'})`;
      case 'updated':
        return `Actualizó proveedor ID ${id}${data.razon_social ? ` - "${data.razon_social}"` : ''}`;
      case 'deleted':
        return `Desactivó proveedor ID ${id}`;
      default:
        return `Acción en proveedor ID ${id}`;
    }
  }

  private getBatchDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó lote ${data.numero_lote || 'N/A'} con ${data.cantidad_inicial || 0} unidades (Vence: ${data.fecha_vencimiento || 'N/A'})`;
      case 'updated':
        return `Actualizó lote ID ${id}${data.numero_lote ? ` - ${data.numero_lote}` : ''}`;
      default:
        return `Acción en lote ID ${id}`;
    }
  }

  private getMovementDescription(action: string, id: number, data: any): string {
    const tipo = data.tipo_movimiento || 'N/A';
    const cantidad = data.cantidad || 0;
    const motivo = data.motivo || '';

    switch (action) {
      case 'created':
        return `Registró movimiento de inventario: ${tipo} de ${cantidad} unidades${motivo ? ` - ${motivo}` : ''}`;
      default:
        return `Acción en movimiento ID ${id}`;
    }
  }

  private getPurchaseOrderDescription(action: string, id: number, data: any): string {
    switch (action) {
      case 'created':
        return `Creó orden de compra OC-${String(id).padStart(6, '0')} por $${data.total || 0}`;
      case 'updated':
        return `Actualizó orden de compra ID ${id}${data.estado ? ` - Estado: ${data.estado}` : ''}`;
      case 'completed':
        return `Completó orden de compra ID ${id} y actualizó inventario`;
      case 'cancelled':
        return `Canceló orden de compra ID ${id}`;
      default:
        return `Acción en orden de compra ID ${id}`;
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
