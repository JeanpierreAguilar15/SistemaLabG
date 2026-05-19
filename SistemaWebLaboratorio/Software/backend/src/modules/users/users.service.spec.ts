import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;

  const mockUsuario = {
    codigo_usuario: 1,
    codigo_rol: 1,
    cedula: '0123456789',
    email: 'test@example.com',
    nombres: 'Juan',
    apellidos: 'Pérez',
    telefono: '0999999999',
    fecha_nacimiento: new Date('1990-01-01'),
    genero: 'M',
    activo: true,
    rol: {
      codigo_rol: 1,
      nombre: 'PACIENTE',
      nivel_acceso: 1,
    },
    perfil_medico: {
      codigo_perfil: 1,
      codigo_usuario: 1,
      tipo_sangre: 'O+',
    },
  };

  const mockPrismaService = {
    usuario: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find a user by codigo_usuario', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUsuario);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUsuario);
      expect(prismaService.usuario.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { codigo_usuario: 1 },
          include: expect.objectContaining({ rol: true, perfil_medico: true }),
        }),
      );
    });

    it('should return null if user not found', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should prevent Personal_Laboratorio from opening non-patient users', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue({
        ...mockUsuario,
        rol: {
          codigo_rol: 2,
          nombre: 'Administrador',
          nivel_acceso: 3,
        },
      });

      await expect(service.findOne(1, 'Personal_Laboratorio')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should limit Personal_Laboratorio listings to patient users', async () => {
      mockPrismaService.usuario.findMany.mockResolvedValue([mockUsuario]);
      mockPrismaService.usuario.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20, {}, 'Personal_Laboratorio');

      expect(result.data).toHaveLength(1);
      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rol: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  nombre: expect.objectContaining({ equals: 'Paciente' }),
                }),
              ]),
            }),
          }),
        }),
      );
      expect(prismaService.usuario.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rol: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findByCedula', () => {
    it('should find a user by cedula', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUsuario);

      const result = await service.findByCedula('0123456789');

      expect(result).toEqual(mockUsuario);
      expect(prismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { cedula: '0123456789' },
        include: { rol: true },
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(null);

      const result = await service.findByCedula('9999999999');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUsuario);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUsuario);
      expect(prismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { rol: true },
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should handle email case sensitivity', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUsuario);

      const result = await service.findByEmail('TEST@EXAMPLE.COM');

      expect(prismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'TEST@EXAMPLE.COM' },
        include: { rol: true },
      });
    });
  });
});
