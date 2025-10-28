import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // cedula
  roles: string[];
}

@Injectable()
export class JwtSvc {
  signAccess(payload: JwtPayload): string {
    const secret = process.env.JWT_ACCESS_SECRET || 'dev_access';
    const exp = process.env.JWT_ACCESS_TTL || '15m';
    return jwt.sign(payload, secret, { expiresIn: exp });
  }
  signRefresh(payload: JwtPayload): string {
    const secret = process.env.JWT_REFRESH_SECRET || 'dev_refresh';
    const exp = process.env.JWT_REFRESH_TTL || '30d';
    return jwt.sign(payload, secret, { expiresIn: exp });
  }
  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
