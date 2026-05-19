/**
 * Mock de PrismaService para usar en las pruebas
 * Este mock simula las operaciones de base de datos sin conectarse realmente
 */
export const mockPrismaService = {
  usuario: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  rol: {
    findFirst: jest.fn(),
  },
  perfilMedico: {
    create: jest.fn(),
  },
  consentimiento: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    createMany: jest.fn(),
  },
  sesion: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  logActividad: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

export const resetMocks = () => {
  Object.values(mockPrismaService).forEach((model) => {
    if (jest.isMockFunction(model)) {
      model.mockReset();
      model.mockImplementation((callback) => callback(mockPrismaService));
      return;
    }
    if (typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });
};
