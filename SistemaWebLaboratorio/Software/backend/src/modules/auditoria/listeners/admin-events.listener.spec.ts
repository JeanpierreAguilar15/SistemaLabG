import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AdminEventsListener } from './admin-events.listener';
import { PrismaService } from '@prisma/prisma.service';
import { AdminEventPayload } from '../../admin/admin-events.service';

describe('AdminEventsListener', () => {
  let listener: AdminEventsListener;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminEventsListener,
        {
          provide: PrismaService,
          useValue: {
            logActividad: {
              create: jest.fn(),
            },
            logError: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    listener = module.get<AdminEventsListener>(AdminEventsListener);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleAdminEvent', () => {
    it('logs admin event with interpreted description', async () => {
      const payload: AdminEventPayload & { eventType: string } = {
        eventType: 'admin.user.created',
        entityType: 'user',
        entityId: 1,
        action: 'created',
        userId: 2,
        data: { rol: 'Paciente', email: 'test@test.com' },
        timestamp: new Date(),
      };

      jest.spyOn(prisma.logActividad, 'create').mockResolvedValue({} as any);

      await listener.handleAdminEvent(payload);

      expect(prisma.logActividad.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          codigo_usuario: payload.userId,
          accion: 'Creacion de usuario',
          entidad: payload.entityType,
          codigo_entidad: payload.entityId,
          descripcion: expect.any(String),
          fecha_accion: payload.timestamp,
        }),
      });

      const descripcion = JSON.parse((prisma.logActividad.create as jest.Mock).mock.calls[0][0].data.descripcion);
      expect(descripcion).toEqual(expect.objectContaining({
        resumen: expect.stringContaining('Creacion de usuario #1'),
        evento: 'admin.user.created',
        detalle: expect.objectContaining({ rol: 'Paciente', email: 'test@test.com' }),
      }));
    });

    it('logs error to LogError if activity logging fails', async () => {
      const payload: AdminEventPayload & { eventType: string } = {
        eventType: 'admin.user.created',
        entityType: 'user',
        entityId: 1,
        action: 'created',
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      const error = new Error('Database error');
      jest.spyOn(prisma.logActividad, 'create').mockRejectedValue(error);
      jest.spyOn(prisma.logError, 'create').mockResolvedValue({} as any);
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

      await listener.handleAdminEvent(payload);

      expect(prisma.logError.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mensaje: expect.stringContaining('Failed to log admin event'),
          endpoint: `admin.${payload.entityType}.${payload.action}`,
          metodo: 'EVENT',
          codigo_usuario: payload.userId,
        }),
      });
    });

    it.each([
      ['admin.user.created', 'user', 'created', 'Creacion de usuario'],
      ['admin.exam.updated', 'exam', 'updated', 'Actualizacion de examen'],
      ['admin.role.deleted', 'role', 'deleted', 'Eliminacion de rol'],
      ['admin.resultado.validated', 'resultado', 'updated', 'Validacion de resultado'],
      ['admin.purchase_order.received', 'purchase_order', 'updated', 'Recepcion de orden de compra'],
    ] as const)('generates action label for %s', async (eventType, entityType, action, expected) => {
      const payload: AdminEventPayload & { eventType: string } = {
        eventType,
        entityType,
        entityId: 1,
        action,
        userId: 2,
        data: {},
        timestamp: new Date(),
      };

      jest.spyOn(prisma.logActividad, 'create').mockResolvedValue({} as any);

      await listener.handleAdminEvent(payload);

      expect(prisma.logActividad.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accion: expected,
        }),
      });
    });
  });

  describe('critical event handlers', () => {
    it('handles user deleted event', async () => {
      const payload = buildPayload('user', 'deleted');
      await expect(listener.handleUserDeleted(payload)).resolves.not.toThrow();
    });

    it('handles role deleted event', async () => {
      const payload = buildPayload('role', 'deleted');
      await expect(listener.handleRoleDeleted(payload)).resolves.not.toThrow();
    });

    it('handles exam created event', async () => {
      const payload = buildPayload('exam', 'created');
      await expect(listener.handleExamCreated(payload)).resolves.not.toThrow();
    });

    it('handles inventory deleted event', async () => {
      const payload = buildPayload('inventory', 'deleted');
      await expect(listener.handleInventoryDeleted(payload)).resolves.not.toThrow();
    });
  });
});

function buildPayload(entityType: string, action: 'created' | 'updated' | 'deleted'): AdminEventPayload {
  return {
    entityType,
    entityId: 1,
    action,
    userId: 2,
    data: {},
    timestamp: new Date(),
  };
}
