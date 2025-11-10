import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'] as string | undefined;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('token requerido');
    }
    const token = header.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'dev_access');
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('token inválido');
    }
  }
}
