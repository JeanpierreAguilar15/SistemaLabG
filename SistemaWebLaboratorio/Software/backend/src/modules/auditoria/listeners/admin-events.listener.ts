import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@prisma/prisma.service';
import { AdminEventPayload } from '../../admin/admin-events.service';
import { buildAuditDescription, formatAuditAction } from '../utils/audit-formatting';

/**
 * Registra eventos administrativos en auditoria para trazabilidad completa.
 */
@Injectable()
export class AdminEventsListener {
  private readonly logger = new Logger(AdminEventsListener.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('admin.*', { async: true })
  async handleAdminEvent(payload: AdminEventPayload & { eventType: string }) {
    try {
      await this.prisma.logActividad.create({
        data: {
          codigo_usuario: payload.userId,
          accion: this.getActionDescription(payload),
          entidad: payload.entityType,
          codigo_entidad: payload.entityId,
          descripcion: buildAuditDescription(payload),
          ip_address: payload.ipAddress || null,
          user_agent: payload.userAgent || null,
          fecha_accion: payload.timestamp,
        },
      });

      this.logger.log(
        `Audit logged: ${payload.entityType}.${payload.action} by user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to log admin event: ${error.message}`, error.stack);

      await this.prisma.logError.create({
        data: {
          nivel: 'ERROR',
          mensaje: `Failed to log admin event: ${payload.entityType}.${payload.action}`,
          stack_trace: error.stack,
          endpoint: `admin.${payload.entityType}.${payload.action}`,
          metodo: 'EVENT',
          ip_address: payload.ipAddress || null,
          user_agent: payload.userAgent || null,
          codigo_usuario: payload.userId,
        },
      }).catch(err => {
        this.logger.error(`Failed to log error: ${err.message}`);
      });
    }
  }

  @OnEvent('admin.user.deleted')
  async handleUserDeleted(payload: AdminEventPayload) {
    this.logger.warn(
      `USER DELETED: User ${payload.entityId} was soft-deleted by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.role.deleted')
  async handleRoleDeleted(payload: AdminEventPayload) {
    this.logger.warn(
      `ROLE DELETED: Role ${payload.entityId} was deleted by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.exam.created')
  async handleExamCreated(payload: AdminEventPayload) {
    this.logger.log(
      `NEW EXAM: Exam ${payload.entityId} created by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.inventory.deleted')
  async handleInventoryDeleted(payload: AdminEventPayload) {
    this.logger.warn(
      `INVENTORY DELETED: Item ${payload.entityId} was deactivated by admin ${payload.userId}`,
    );
  }

  @OnEvent('admin.resultado.validated')
  async handleResultadoValidated(payload: AdminEventPayload) {
    this.logger.log(
      `RESULTADO VALIDATED: #${payload.entityId} by user ${payload.userId} | ${payload.data?.examen}`,
    );
  }

  @OnEvent('admin.resultado.insumos_failed')
  async handleResultadoInsumosFailed(payload: AdminEventPayload) {
    this.logger.warn(
      `INSUMOS DEDUCTION FAILED: Resultado #${payload.entityId} | ${payload.data?.error}`,
    );
  }

  private getActionDescription(payload: AdminEventPayload & { eventType?: string }): string {
    return formatAuditAction(payload.entityType, payload.action, payload.eventType);
  }
}
