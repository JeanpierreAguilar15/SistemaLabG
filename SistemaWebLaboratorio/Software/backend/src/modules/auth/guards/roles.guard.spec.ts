import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function createContext(userRole: string): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: { rol: userRole },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows legacy ADMIN users when a route requires Administrador', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['Administrador']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext('ADMIN'))).toBe(true);
  });

  it('allows canonical Personal_Laboratorio users when a route still requires PERSONAL_LAB', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['PERSONAL_LAB']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext('Personal_Laboratorio'))).toBe(true);
  });

  it('denies Paciente users from administrator routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['Administrador']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext('Paciente'))).toBe(false);
  });
});
