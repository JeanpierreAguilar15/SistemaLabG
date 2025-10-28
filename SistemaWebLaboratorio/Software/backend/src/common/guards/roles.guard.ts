import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user as { cedula: string; roles?: Role[] } | undefined;
    if (!user) throw new ForbiddenException('no autenticado');
    const roles = user.roles ?? [];
    const ok = required.some((r) => roles.includes(r));
    if (!ok) throw new ForbiddenException('acceso denegado');
    return true;
  }
}

