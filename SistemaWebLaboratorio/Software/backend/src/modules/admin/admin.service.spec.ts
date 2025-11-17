import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
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
            servicio: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            sede: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            examen: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
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
            paquete: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            paqueteExamen: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
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
            cita: {
              count: jest.fn(),
            },
            resultado: {
              count: jest.fn(),
            },
            precio: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return paginated users without sensitive data', async () => {
      const mockUsers = [
        {
          codigo_usuario: 1,
          nombres: 'Juan',
          apellidos: 'Pérez',
          email: 'juan@test.com',
          password_hash: 'hash123',
          salt: 'salt123',
          rol: { codigo_rol: 1, nombre: 'Paciente' },
        },
      ];

      jest.spyOn(prisma.usuario, 'findMany').mockResolvedValue(mockUsers as any);
      jest.spyOn(prisma.usuario, 'count').mockResolvedValue(1);

      const result = await service.getAllUsers(1, 20);

      expect(result.data).toBeDefined();
      expect(result.data[0]).not.toHaveProperty('password_hash');
      expect(result.data[0]).not.toHaveProperty('salt');
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      jest.spyOn(prisma.usuario, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.usuario, 'count').mockResolvedValue(0);

      const filters = {
        search: 'Juan',
        codigo_rol: '1',
        activo: 'true',
      };

      await service.getAllUsers(1, 20, filters);

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            codigo_rol: 1,
            activo: true,
          }),
        }),
      );
    });
  });

  describe('getUserById', () => {
    it('should return user without sensitive data', async () => {
      const mockUser = {
        codigo_usuario: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        password_hash: 'hash123',
        salt: 'salt123',
        rol: { codigo_rol: 1, nombre: 'Paciente' },
        perfil_medico: null,
        sesiones: [],
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.getUserById(1);

      expect(result).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('salt');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    it('should create user and hash password', async () => {
      const userData = {
        codigo_rol: 1,
        cedula: '1234567890',
        nombres: 'Juan',
        apellidos: 'Pérez',
        email: 'juan@test.com',
        password: 'password123',
      };

      jest.spyOn(prisma.usuario, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'create').mockResolvedValue({
        codigo_usuario: 1,
        ...userData,
        password_hash: 'hashed',
        salt: 'salt',
        rol: { codigo_rol: 1, nombre: 'Paciente' },
      } as any);

      const result = await service.createUser(userData);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('salt');
      expect(prisma.usuario.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email or cedula already exists', async () => {
      const userData = {
        codigo_rol: 1,
        cedula: '1234567890',
        nombres: 'Juan',
        apellidos: 'Pérez',
        email: 'juan@test.com',
        password: 'password123',
      };

      jest.spyOn(prisma.usuario, 'findFirst').mockResolvedValue({ codigo_usuario: 1 } as any);

      await expect(service.createUser(userData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should deactivate user instead of deleting', async () => {
      const mockUser = { codigo_usuario: 1, activo: true };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({
        ...mockUser,
        activo: false,
        password_hash: 'hash',
        salt: 'salt',
      } as any);

      const result = await service.deleteUser(1);

      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { codigo_usuario: 1 },
        data: { activo: false },
      });
      expect(result).not.toHaveProperty('password_hash');
    });
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
    it('should throw BadRequestException if role has users assigned', async () => {
      const mockRole = {
        codigo_rol: 1,
        nombre: 'Paciente',
        _count: { usuarios: 5 },
      };

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);

      await expect(service.deleteRole(1)).rejects.toThrow(BadRequestException);
    });

    it('should delete role if no users assigned', async () => {
      const mockRole = {
        codigo_rol: 1,
        nombre: 'TestRole',
        _count: { usuarios: 0 },
      };

      jest.spyOn(prisma.rol, 'findUnique').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.rol, 'delete').mockResolvedValue(mockRole as any);

      await service.deleteRole(1);

      expect(prisma.rol.delete).toHaveBeenCalledWith({
        where: { codigo_rol: 1 },
      });
    });
  });

  describe('getAllExams', () => {
    it('should return paginated exams with active prices', async () => {
      const mockExams = [
        {
          codigo_examen: 1,
          nombre: 'Hemograma',
          categoria: { nombre: 'Hematología' },
          precios: [{ precio: 25.0, activo: true }],
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

      await expect(service.createExam(examData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      jest.spyOn(prisma.usuario, 'count').mockResolvedValue(100);
      jest.spyOn(prisma.examen, 'count').mockResolvedValue(50);
      jest.spyOn(prisma.cita, 'count').mockResolvedValue(200);
      jest.spyOn(prisma.resultado, 'count').mockResolvedValue(10);
      jest.spyOn(prisma.item, 'count').mockResolvedValue(5);
      jest.spyOn(prisma.logActividad, 'findMany').mockResolvedValue([]);

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('exams');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('inventory');
      expect(result).toHaveProperty('recentActivities');
    });
  });
});
