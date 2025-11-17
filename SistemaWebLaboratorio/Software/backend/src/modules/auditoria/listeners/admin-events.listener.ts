import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminEventPayload } from '../../admin/admin-events.service';

/**
 * Listener que registra todos los eventos administrativos en la tabla de auditoría
 * Proporciona trazabilidad completa de todas las acciones admin
 */
@Injectable()
export class AdminEventsListener {
  private readonly logger = new Logger(AdminEventsListener.name);

  constructor(private readonly prisma: PrismaService) {}

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
          id_entidad: payload.entityId.toString(),
          detalles: JSON.stringify(payload.data || {}),
          ip_address: null, // TODO: Obtener del request
          user_agent: null, // TODO: Obtener del request
          fecha_accion: payload.timestamp,
        },
      });

      this.logger.log(
        `📝 Audit logged: ${payload.entityType}.${payload.action} by user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to log admin event: ${error.message}`, error.stack);

      // Registrar error en log de errores
      await this.prisma.logError.create({
        data: {
          mensaje: `Failed to log admin event: ${payload.entityType}.${payload.action}`,
          stack_trace: error.stack,
          codigo_http: null,
          endpoint: `admin.${payload.entityType}.${payload.action}`,
          metodo_http: 'EVENT',
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

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
