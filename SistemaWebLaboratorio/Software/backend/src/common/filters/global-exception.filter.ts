import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditService } from '../../modules/audit/audit.service';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly audit: AuditService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? (exception as HttpException).getStatus() : 500;

    // Determinar mensaje amigable
    let message: string = 'Error interno del servidor';
    if (isHttp) {
      try {
        const payload: any = (exception as HttpException).getResponse();
        // Nest puede devolver string o { message }
        message = typeof payload === 'string' ? payload : payload?.message || (exception as HttpException).message;
      } catch {
        message = (exception as HttpException).message;
      }
    } else {
      message = (exception as any)?.message || message;
    }

    // Capturar datos para auditoría, pero sin romper el response si falla
    try {
      const user = (req as any)?.user;
      const user_agent = req.headers['user-agent'] || '';
      const fwd = (req.headers['x-forwarded-for'] as string | undefined) || '';
      const ip = (fwd ? fwd.split(',')[0].trim() : '') || (req as any).ip || (req.socket as any)?.remoteAddress || '';
      const stack = (exception as any)?.stack ?? null;
      await this.audit.logError({
        origen: `${req.method} ${req.url} [${status}]`,
        mensaje_error: message,
        stack_trace: stack,
        metadata: { ip, user_agent },
        cedula: user?.sub ?? null,
      });
    } catch {
      // No propagar errores de auditoría
    }

    // Responder de forma controlada sin re-lanzar
    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}




