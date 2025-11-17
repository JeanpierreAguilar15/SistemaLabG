import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AdminEventPayload } from '../../admin/admin-events.service';

/**
 * Listener que invalida caché del catálogo cuando los datos cambian
 * Asegura que el catálogo público siempre muestre información actualizada
 */
@Injectable()
export class CatalogoAdminEventsListener {
  private readonly logger = new Logger(CatalogoAdminEventsListener.name);

  // TODO: Inyectar CacheManager cuando se implemente caching
  // constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Invalida caché cuando se crean/actualizan/eliminan exámenes
   */
  @OnEvent('admin.exam.*')
  async handleExamChange(payload: AdminEventPayload) {
    this.logger.log(
      `🔄 Invalidating exam cache due to ${payload.action} on exam ${payload.entityId}`,
    );

    // TODO: Implementar invalidación de caché
    // await this.cacheManager.del('catalog:exams');
    // await this.cacheManager.del(`catalog:exam:${payload.entityId}`);

    // Por ahora, solo loguear
    this.logger.debug(`Cache invalidation triggered for exam operations`);
  }

  /**
   * Invalida caché cuando se crean/actualizan precios
   */
  @OnEvent('admin.price.*')
  async handlePriceChange(payload: AdminEventPayload) {
    this.logger.log(
      `💰 Invalidating price cache due to ${payload.action} on price ${payload.entityId}`,
    );

    // TODO: Implementar invalidación de caché
    // const examId = payload.data?.examId;
    // if (examId) {
    //   await this.cacheManager.del(`catalog:exam:${examId}:prices`);
    // }
    // await this.cacheManager.del('catalog:prices');

    this.logger.debug(`Cache invalidation triggered for price operations`);
  }

  /**
   * Invalida caché cuando se crean/actualizan/eliminan categorías
   */
  @OnEvent('admin.category.*')
  async handleCategoryChange(payload: AdminEventPayload) {
    this.logger.log(
      `📂 Invalidating category cache due to ${payload.action} on category ${payload.entityId}`,
    );

    // TODO: Implementar invalidación de caché
    // await this.cacheManager.del('catalog:categories');
    // await this.cacheManager.del(`catalog:category:${payload.entityId}`);

    this.logger.debug(`Cache invalidation triggered for category operations`);
  }

  /**
   * Invalida caché cuando se crean/actualizan/eliminan paquetes
   */
  @OnEvent('admin.package.*')
  async handlePackageChange(payload: AdminEventPayload) {
    this.logger.log(
      `📦 Invalidating package cache due to ${payload.action} on package ${payload.entityId}`,
    );

    // TODO: Implementar invalidación de caché
    // await this.cacheManager.del('catalog:packages');
    // await this.cacheManager.del(`catalog:package:${payload.entityId}`);

    this.logger.debug(`Cache invalidation triggered for package operations`);
  }

  /**
   * Invalida caché cuando se crean/actualizan/eliminan sedes
   */
  @OnEvent('admin.location.*')
  async handleLocationChange(payload: AdminEventPayload) {
    this.logger.log(
      `🏢 Invalidating location cache due to ${payload.action} on location ${payload.entityId}`,
    );

    // TODO: Implementar invalidación de caché
    // await this.cacheManager.del('catalog:locations');

    this.logger.debug(`Cache invalidation triggered for location operations`);
  }

  /**
   * Notifica cambios generales en el catálogo
   * Puede usarse para websockets/SSE en el futuro
   */
  @OnEvent('admin.*')
  async notifyCatalogUpdate(payload: AdminEventPayload & { eventType: string }) {
    // Solo procesar eventos relacionados con el catálogo público
    const catalogEntities = ['exam', 'price', 'category', 'package', 'location', 'service'];

    if (catalogEntities.includes(payload.entityType)) {
      this.logger.debug(
        `📢 Catalog update notification: ${payload.entityType} ${payload.action}`,
      );

      // TODO: Implementar notificación en tiempo real
      // this.websocketGateway.notifyCatalogUpdate({
      //   type: payload.entityType,
      //   action: payload.action,
      //   entityId: payload.entityId,
      // });
    }
  }
}
