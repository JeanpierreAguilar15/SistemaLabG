import { Test, TestingModule } from '@nestjs/testing';
import { AgendaService } from './agenda.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AgendaService', () => {
  let service: AgendaService;
  let prisma: PrismaService;
  let eventsGateway: EventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: PrismaService,
          useValue: {
            slot: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            cita: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            servicio: {
              findUnique: jest.fn(),
            },
            sede: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: EventsGateway,
          useValue: {
            notifyCatalogUpdate: jest.fn(),
            notifyAppointmentUpdate: jest.fn(),
            notifyAdminEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
    prisma = module.get<PrismaService>(PrismaService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSlot', () => {
    it('should create a slot successfully', async () => {
      const slotData = {
        codigo_servicio: 1,
        codigo_sede: 1,
        fecha: '2025-01-25',
        hora_inicio: '09:00',
        hora_fin: '09:30',
        cupos_totales: 5,
      };

      const mockServicio = { codigo_servicio: 1, nombre: 'Consulta General' };
      const mockSede = { codigo_sede: 1, nombre: 'Sede Principal' };
      const mockSlot = {
        codigo_slot: 1,
        ...slotData,
        cupos_disponibles: 5,
        servicio: mockServicio,
        sede: mockSede,
      };

      jest.spyOn(prisma.servicio, 'findUnique').mockResolvedValue(mockServicio as any);
      jest.spyOn(prisma.sede, 'findUnique').mockResolvedValue(mockSede as any);
      jest.spyOn(prisma.slot, 'create').mockResolvedValue(mockSlot as any);

      const result = await service.createSlot(slotData, 1);

      expect(result).toEqual(mockSlot);
      expect(prisma.slot.create).toHaveBeenCalled();
      expect(eventsGateway.notifyCatalogUpdate).toHaveBeenCalledWith({
        type: 'slot',
        action: 'created',
        entityId: 1,
        entityName: 'Consulta General - Sede Principal',
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      const slotData = {
        codigo_servicio: 999,
        codigo_sede: 1,
        fecha: '2025-01-25',
        hora_inicio: '09:00',
        hora_fin: '09:30',
      };

      jest.spyOn(prisma.servicio, 'findUnique').mockResolvedValue(null);

      await expect(service.createSlot(slotData, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for past dates', async () => {
      const slotData = {
        codigo_servicio: 1,
        codigo_sede: 1,
        fecha: '2020-01-01',
        hora_inicio: '09:00',
        hora_fin: '09:30',
      };

      const mockServicio = { codigo_servicio: 1 };
      const mockSede = { codigo_sede: 1 };

      jest.spyOn(prisma.servicio, 'findUnique').mockResolvedValue(mockServicio as any);
      jest.spyOn(prisma.sede, 'findUnique').mockResolvedValue(mockSede as any);

      await expect(service.createSlot(slotData, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createCita', () => {
    it('should create appointment successfully', async () => {
      const citaData = {
        codigo_slot: 1,
        observaciones: 'Test observation',
      };

      const mockSlot = {
        codigo_slot: 1,
        activo: true,
        cupos_disponibles: 5,
        servicio: { nombre: 'Consulta' },
        sede: { nombre: 'Sede Principal' },
      };

      const mockCita = {
        codigo_cita: 1,
        codigo_slot: 1,
        codigo_paciente: 10,
        estado: 'AGENDADA',
        slot: mockSlot,
        paciente: {
          codigo_usuario: 10,
          nombres: 'Juan',
          apellidos: 'Pérez',
        },
      };

      jest.spyOn(prisma.slot, 'findUnique').mockResolvedValue(mockSlot as any);
      jest.spyOn(prisma.cita, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([mockCita, {}] as any);

      const result = await service.createCita(citaData, 10);

      expect(result).toEqual(mockCita);
      expect(eventsGateway.notifyAppointmentUpdate).toHaveBeenCalledWith({
        appointmentId: 1,
        patientId: 10,
        action: 'created',
        appointment: mockCita,
      });
      expect(eventsGateway.notifyAdminEvent).toHaveBeenCalled();
    });

    it('should throw BadRequestException if slot has no capacity', async () => {
      const citaData = {
        codigo_slot: 1,
      };

      const mockSlot = {
        codigo_slot: 1,
        activo: true,
        cupos_disponibles: 0,
      };

      jest.spyOn(prisma.slot, 'findUnique').mockResolvedValue(mockSlot as any);

      await expect(service.createCita(citaData, 10)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if patient already has appointment', async () => {
      const citaData = {
        codigo_slot: 1,
      };

      const mockSlot = {
        codigo_slot: 1,
        activo: true,
        cupos_disponibles: 5,
      };

      const existingCita = {
        codigo_cita: 1,
        estado: 'AGENDADA',
      };

      jest.spyOn(prisma.slot, 'findUnique').mockResolvedValue(mockSlot as any);
      jest.spyOn(prisma.cita, 'findFirst').mockResolvedValue(existingCita as any);

      await expect(service.createCita(citaData, 10)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyCitas', () => {
    it('should return patient appointments', async () => {
      const mockCitas = [
        {
          codigo_cita: 1,
          codigo_paciente: 10,
          slot: {
            servicio: { nombre: 'Consulta' },
            sede: { nombre: 'Sede Principal' },
          },
        },
      ];

      jest.spyOn(prisma.cita, 'findMany').mockResolvedValue(mockCitas as any);

      const result = await service.getMyCitas(10);

      expect(result).toEqual(mockCitas);
      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: { codigo_paciente: 10 },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe('cancelarCita', () => {
    it('should cancel appointment and free slot', async () => {
      const mockCita = {
        codigo_cita: 1,
        codigo_paciente: 10,
        codigo_slot: 1,
        estado: 'AGENDADA',
        slot: {
          codigo_slot: 1,
        },
      };

      const mockUpdatedCita = {
        ...mockCita,
        estado: 'CANCELADA',
        motivo_cancelacion: 'Motivo de prueba',
      };

      jest.spyOn(prisma.cita, 'findUnique').mockResolvedValue(mockCita as any);
      jest.spyOn(prisma.cita, 'update').mockResolvedValue(mockUpdatedCita as any);
      jest.spyOn(prisma.slot, 'update').mockResolvedValue({} as any);

      const result = await service.cancelarCita(1, 'Motivo de prueba', 10);

      expect(prisma.slot.update).toHaveBeenCalledWith({
        where: { codigo_slot: 1 },
        data: { cupos_disponibles: { increment: 1 } },
      });
      expect(eventsGateway.notifyAppointmentUpdate).toHaveBeenCalledWith({
        appointmentId: 1,
        patientId: 10,
        action: 'cancelled',
        appointment: expect.any(Object),
      });
    });
  });

  describe('getEstadisticas', () => {
    it('should return appointment statistics', async () => {
      jest.spyOn(prisma.cita, 'count')
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30)  // agendadas
        .mockResolvedValueOnce(40)  // confirmadas
        .mockResolvedValueOnce(10)  // canceladas
        .mockResolvedValueOnce(15)  // completadas
        .mockResolvedValueOnce(5);  // no asistio

      const result = await service.getEstadisticas();

      expect(result).toEqual({
        total: 100,
        agendadas: 30,
        confirmadas: 40,
        canceladas: 10,
        completadas: 15,
        no_asistio: 5,
        tasa_asistencia: '16.67',
      });
    });
  });
});
