import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminEventsService } from './admin-events.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;
  let eventsService: AdminEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: AdminEventsService,
          useValue: {
            emitUserCreated: jest.fn(),
            emitUserUpdated: jest.fn(),
            emitUserDeleted: jest.fn(),
            emitRoleCreated: jest.fn(),
            emitRoleUpdated: jest.fn(),
            emitRoleDeleted: jest.fn(),
            emitExamCreated: jest.fn(),
            emitExamUpdated: jest.fn(),
            emitExamDeleted: jest.fn(),
            emitCategoryCreated: jest.fn(),
            emitCategoryUpdated: jest.fn(),
            emitCategoryDeleted: jest.fn(),
            emitInventoryItemCreated: jest.fn(),
            emitInventoryItemUpdated: jest.fn(),
            emitInventoryItemDeleted: jest.fn(),
            emitSupplierCreated: jest.fn(),
            emitSupplierUpdated: jest.fn(),
            emitSupplierDeleted: jest.fn(),
            emitEvent: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            usuario: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            rol: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            examen: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            categoriaExamen: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            item: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              fields: {
                stock_minimo: {},
              },
            },
            proveedor: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            logActividad: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            logError: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            resultado: {
              count: jest.fn(),
            },
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    eventsService = module.get<AdminEventsService>(AdminEventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });



  describe('getAllRoles', () => {
    it('should return all roles with user count', async () => {
      const mockRoles = [
        {
          codigo_rol: 1,
          nombre: 'Administrador',
          _count: { usuarios: 5 },
        },
      ];

      jest.spyOn(prisma.rol, 'findMany').mockResolvedValue(mockRoles as any);

      const result = await service.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(prisma.rol.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: { usuarios: true },
            },
          },
        }),
      );
    });
  });

  describe('deleteRole', () => {
    it('should not delete canonical system roles even without assigned users', async () => {
      const mockRole = {
        codigo_rol: 3,
        nombre: 'Paciente',
        _count: { usuarios: 0 },
      };

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);

      await expect(service.deleteRole(3, 2)).rejects.toThrow(BadRequestException);
      expect(prisma.rol.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if role has users assigned', async () => {
      const mockRole = {
        codigo_rol: 1,
        nombre: 'Paciente',
        _count: { usuarios: 5 },
      };

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);

      await expect(service.deleteRole(1, 2)).rejects.toThrow(BadRequestException);
    });

    it('should delete role if no users assigned', async () => {
      const mockRole = {
        codigo_rol: 1,
        nombre: 'TestRole',
        _count: { usuarios: 0 },
      };

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.rol, 'delete').mockResolvedValue(mockRole as any);

      await service.deleteRole(1, 2);

      expect(prisma.rol.delete).toHaveBeenCalledWith({
        where: { codigo_rol: 1 },
      });
    });

    it('should emit role deleted event', async () => {
      const mockRole = {
        codigo_rol: 1,
        nombre: 'TestRole',
        _count: { usuarios: 0 },
      };
      const adminId = 2;

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.rol, 'delete').mockResolvedValue(mockRole as any);

      await service.deleteRole(1, adminId);

      expect(eventsService.emitRoleDeleted).toHaveBeenCalledWith(1, adminId);
    });
  });

  describe('updateRole', () => {
    it('should not rename canonical system roles', async () => {
      const mockRole = {
        codigo_rol: 2,
        nombre: 'Personal_Laboratorio',
        nivel_acceso: 2,
        activo: true,
        _count: { usuarios: 0 },
      };

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);

      await expect(
        service.updateRole(2, { nombre: 'Paciente' }, 1),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.rol.update).not.toHaveBeenCalled();
    });

    it('should not deactivate canonical system roles', async () => {
      const mockRole = {
        codigo_rol: 3,
        nombre: 'Paciente',
        nivel_acceso: 1,
        activo: true,
        _count: { usuarios: 0 },
      };

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);

      await expect(
        service.updateRole(3, { activo: false }, 1),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.rol.update).not.toHaveBeenCalled();
    });
  });

  describe('getAllExams', () => {
    it('should return paginated exams with active prices', async () => {
      const mockExams = [
        {
          codigo_examen: 1,
          nombre: 'Hemograma',
          categoria: { nombre: 'Hematología' },
        },
      ];

      jest.spyOn(prisma.examen, 'findMany').mockResolvedValue(mockExams as any);
      jest.spyOn(prisma.examen, 'count').mockResolvedValue(1);

      const result = await service.getAllExams(1, 50);

      expect(result.data).toEqual(mockExams);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('createExam', () => {
    it('should throw BadRequestException if codigo_interno already exists', async () => {
      const examData = {
        codigo_interno: 'HEM001',
        nombre: 'Hemograma',
      };

      jest.spyOn(prisma.examen, 'findUnique').mockResolvedValue({ codigo_examen: 1 } as any);

      await expect(service.createExam(examData, 2)).rejects.toThrow(BadRequestException);
    });

    it('should emit exam created event', async () => {
      const examData = {
        codigo_interno: 'HEM001',
        nombre: 'Hemograma',
        codigo_categoria: 1,
      };
      const adminId = 2;

      jest.spyOn(prisma.examen, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.examen, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.categoriaExamen, 'findUnique').mockResolvedValue({
        codigo_categoria: 1,
        nombre: 'Hematologia',
        activo: true,
      } as any);
      jest.spyOn(prisma.examen, 'create').mockResolvedValue({
        codigo_examen: 1,
        activo: true,
        ...examData,
      } as any);

      await service.createExam(examData, adminId);

      expect(eventsService.emitExamCreated).toHaveBeenCalledWith(
        1,
        adminId,
        expect.objectContaining({
          nombre: examData.nombre,
          codigo_interno: examData.codigo_interno,
        }),
      );
    });

    it('should reject inactive exam categories', async () => {
      const examData = {
        codigo_interno: 'BIO001',
        nombre: 'Perfil Bioquimico',
        codigo_categoria: 7,
      };

      jest.spyOn(prisma.examen, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.examen, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.categoriaExamen, 'findUnique').mockResolvedValue({
        codigo_categoria: 7,
        nombre: 'Bioquimica',
        activo: false,
      } as any);

      await expect(service.createExam(examData, 2)).rejects.toThrow(/categoria activa/i);
      expect(prisma.examen.create).not.toHaveBeenCalled();
    });

    it('should reject invalid numeric reference ranges', async () => {
      const examData = {
        codigo_interno: 'GLU001',
        nombre: 'Glucosa',
        codigo_categoria: 1,
        valor_referencia_min: 120,
        valor_referencia_max: 80,
        unidad_medida: 'mg/dL',
      };

      jest.spyOn(prisma.examen, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.examen, 'findFirst').mockResolvedValue(null);

      await expect(service.createExam(examData, 2)).rejects.toThrow(/rango/i);
      expect(prisma.examen.create).not.toHaveBeenCalled();
    });
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      jest.spyOn(prisma.usuario, 'count').mockResolvedValue(100);
      jest.spyOn(prisma.examen, 'count').mockResolvedValue(50);
      jest.spyOn(prisma.resultado, 'count').mockResolvedValue(10);
      jest.spyOn(prisma.item, 'count').mockResolvedValue(5);
      jest.spyOn(prisma, '$queryRaw' as any).mockResolvedValue([{ count: 5 }]);
      jest.spyOn(prisma.logActividad, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.examen, 'findMany').mockResolvedValue([]);

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('exams');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('inventory');
      expect(result).toHaveProperty('recentExams');
    });
  });

  describe('getDashboardStats', () => {
    it('does not return fake zero stats when dashboard queries fail', async () => {
      jest.spyOn(prisma.usuario, 'count').mockRejectedValue(new Error('database unavailable'));

      await expect(service.getDashboardStats()).rejects.toThrow('database unavailable');
    });
  });
});
