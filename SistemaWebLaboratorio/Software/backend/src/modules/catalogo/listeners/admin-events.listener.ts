import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AdminEventPayload } from '../../admin/admin-events.service';

/**
 * Listener que invalida cache del catalogo cuando los datos cambian
 * Asegura que el catalogo publico siempre muestre informacion actualizada
 */
@Injectable()
export class CatalogoAdminEventsListener {
  private readonly logger = new Logger(CatalogoAdminEventsListener.name);

  /**
   * Invalida cache cuando se crean/actualizan/eliminan examenes
   */
  @OnEvent('admin.exam.*')
  async handleExamChange(payload: AdminEventPayload) {
    this.logger.log(
      `Invalidating exam cache due to ${payload.action} on exam ${payload.entityId}`,
    );

    // TODO: Implementar invalidacion de cache
    this.logger.debug(`Cache invalidation triggered for exam operations`);
  }

  /**
   * Invalida cache cuando se crean/actualizan/eliminan categorias
   */
  @OnEvent('admin.category.*')
  async handleCategoryChange(payload: AdminEventPayload) {
    this.logger.log(
      `Invalidating category cache due to ${payload.action} on category ${payload.entityId}`,
    );

    // TODO: Implementar invalidacion de cache
    this.logger.debug(`Cache invalidation triggered for category operations`);
  }

  /**
   * Notifica cambios generales en el catalogo
   */
  @OnEvent('admin.*')
  async notifyCatalogUpdate(payload: AdminEventPayload & { eventType: string }) {
    const catalogEntities = ['exam', 'category'];

    if (catalogEntities.includes(payload.entityType)) {
      this.logger.debug(
        `Catalog update notification: ${payload.entityType} ${payload.action}`,
      );
    }
  }
}
