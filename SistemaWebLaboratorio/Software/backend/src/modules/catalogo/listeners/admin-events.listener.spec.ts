import { Test, TestingModule } from '@nestjs/testing';
import { CatalogoAdminEventsListener } from './admin-events.listener';
import { AdminEventPayload } from '../../admin/admin-events.service';

describe('CatalogoAdminEventsListener', () => {
  let listener: CatalogoAdminEventsListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CatalogoAdminEventsListener],
    }).compile();

    listener = module.get<CatalogoAdminEventsListener>(CatalogoAdminEventsListener);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('Cache Invalidation Handlers', () => {
    it('should handle exam change event', async () => {
      const payload: AdminEventPayload = {
        entityType: 'exam',
        entityId: 1,
        action: 'created',
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      await expect(listener.handleExamChange(payload)).resolves.not.toThrow();
    });

    it('should handle exam update event', async () => {
      const payload: AdminEventPayload = {
        entityType: 'exam',
        entityId: 1,
        action: 'updated',
        userId: 2,
        data: { changedFields: ['nombre'] },
        timestamp: new Date(),
      };

      await expect(listener.handleExamChange(payload)).resolves.not.toThrow();
    });

    it('should handle exam delete event', async () => {
      const payload: AdminEventPayload = {
        entityType: 'exam',
        entityId: 1,
        action: 'deleted',
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      await expect(listener.handleExamChange(payload)).resolves.not.toThrow();
    });

    it('should handle category change event', async () => {
      const payload: AdminEventPayload = {
        entityType: 'category',
        entityId: 1,
        action: 'updated',
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      await expect(listener.handleCategoryChange(payload)).resolves.not.toThrow();
    });

  });

  describe('Catalog Update Notification', () => {
    it('should notify catalog update for exam entity', async () => {
      const payload: AdminEventPayload & { eventType: string } = {
        eventType: 'admin.exam.created',
        entityType: 'exam',
        entityId: 1,
        action: 'created',
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      await expect(listener.notifyCatalogUpdate(payload)).resolves.not.toThrow();
    });

    it('should notify catalog update for category entity', async () => {
      const payload: AdminEventPayload & { eventType: string } = {
        eventType: 'admin.category.deleted',
        entityType: 'category',
        entityId: 1,
        action: 'deleted',
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      await expect(listener.notifyCatalogUpdate(payload)).resolves.not.toThrow();
    });

    it('should not process non-catalog entities', async () => {
      const payload: AdminEventPayload & { eventType: string } = {
        eventType: 'admin.user.created',
        entityType: 'user',
        entityId: 1,
        action: 'created',
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      // Should still resolve without throwing
      await expect(listener.notifyCatalogUpdate(payload)).resolves.not.toThrow();
    });
  });
});
