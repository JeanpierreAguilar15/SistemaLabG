import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PasswordService } from '../../common/crypto/password.service';
import { AuditService } from '../audit/audit.service';
import { ConfirmResetDto } from './dtos/confirm-reset.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { RequestResetDto } from './dtos/request-reset.dto';
import { createSession, findActiveSessionByHash, revokeAllSessions } from './repos/session.repo';
import { assignRole, createUser, emailExists, findUserByCedula, findUserByEmail, getUserRoles } from './repos/user.repo';
import { JwtSvc } from './services/jwt.service';
import { EmailService } from '../../common/mail/email.service';
import crypto from 'crypto';
import { query } from '../../infra/db';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly pwd: PasswordService,
    private readonly jwt: JwtSvc,
    private readonly audit: AuditService,
    private readonly mail: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await findUserByCedula(dto.cedula);
    if (existing) throw new BadRequestException('cedula ya registrada');
    if (await emailExists(dto.email)) throw new BadRequestException('email ya registrado');

    const password_hash = await this.pwd.hash(dto.password);
    await createUser({
      cedula: dto.cedula,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      email: dto.email,
      telefono: dto.telefono ?? null,
      password_hash,
    });
    await assignRole(dto.cedula, 'PACIENTE');
    await this.audit.log({
      cedula: dto.cedula,
      modulo: 'LOGIN',
      accion: 'REGISTRO_OK',
      descripcion: 'registro de paciente',
    });
    return { ok: true };
  }

  async login(dto: LoginDto) {
    // bloqueo por intentos fallidos configurable
    const maxAttempts = parseInt(process.env.LOGIN_MAX_FAILED_ATTEMPTS || '5', 10);
    const windowMinutes = parseInt(process.env.LOGIN_FAIL_WINDOW_MINUTES || '15', 10);
    const intervalTxt = `${windowMinutes} minutes`;
    const { rows: attempts } = await query<{ c: number }>(
      `select count(*)::int as c
         from auditoria.tb_auditoria
        where cedula = $1 and modulo = 'LOGIN' and accion = 'LOGIN_FALLIDO' and fecha_evento > now() - $2::interval`,
      [dto.cedula, intervalTxt],
    );
    if ((attempts[0]?.c ?? 0) >= maxAttempts) {
      await this.audit.log({ cedula: dto.cedula, modulo: 'LOGIN', accion: 'LOGIN_BLOQUEADO', descripcion: 'demasiados intentos fallidos', metadata: { ip: dto.ip, user_agent: dto.user_agent } });
      throw new UnauthorizedException('cuenta temporalmente bloqueada');
    }
    const user = await findUserByCedula(dto.cedula);
    if (!user) {
      await this.audit.log({ cedula: dto.cedula, modulo: 'LOGIN', accion: 'LOGIN_FALLIDO', descripcion: 'usuario no encontrado', metadata: { ip: dto.ip, user_agent: dto.user_agent } });
      throw new UnauthorizedException('credenciales inválidas');
    }
    const valid = await this.pwd.verify(dto.password, user.password_hash);
    if (!valid) {
      await this.audit.log({ cedula: dto.cedula, modulo: 'LOGIN', accion: 'LOGIN_FALLIDO', descripcion: 'password inválido', metadata: { ip: dto.ip, user_agent: dto.user_agent } });
      throw new UnauthorizedException('credenciales inválidas');
    }
    const roles = await getUserRoles(user.cedula);
    const access = this.jwt.signAccess({ sub: user.cedula, roles });
    const refresh = this.jwt.signRefresh({ sub: user.cedula, roles });
    const refresh_hash = crypto.createHash('sha256').update(refresh).digest('hex');
    // calcular expira_en desde 'exp' del JWT de refresh
    const decoded: any = this.jwt.decode(refresh);
    const expira_en = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await createSession({ cedula: user.cedula, refresh_hash, expira_en, ip_origen: dto.ip, user_agent: dto.user_agent });
    await this.audit.log({ cedula: user.cedula, modulo: 'LOGIN', accion: 'LOGIN_OK', descripcion: 'login correcto', metadata: { ip: dto.ip, user_agent: dto.user_agent } });
    return { access_token: access, refresh_token: refresh, roles };
  }

  async logoutGlobal(cedula: string) {
    const count = await revokeAllSessions(cedula);
    await this.audit.log({ cedula, modulo: 'LOGIN', accion: 'LOGOUT_GLOBAL', descripcion: `revocadas ${count} sesiones` });
    return { ok: true, revocadas: count };
  }

  async requestPasswordReset(dto: RequestResetDto) {
    const user = dto.cedula
      ? await findUserByCedula(dto.cedula)
      : dto.email
      ? await findUserByEmail(dto.email)
      : null;
    if (!user) return { ok: true }; // no revelar existencia
    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');
    const expira = new Date(Date.now() + 1000 * 60 * 15);
    await query(
      `insert into usuario.tokens_recuperacion (cedula, token_hash, expira_en)
       values ($1,$2,$3)`,
      [user.cedula, token_hash, expira],
    );
    await this.audit.log({ cedula: user.cedula, modulo: 'LOGIN', accion: 'PASSWORD_RESET_REQUEST' });
    // En producción se enviaría un correo con el link de reseteo.
    // En desarrollo devolvemos el token (y un link) para pruebas manuales.
    const resetLink = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset?token=${token}`;
    let email_sent = false;
    try{
      if (process.env.SMTP_HOST) {
        const res = await this.mail.send(
          user.email,
          'Recuperación de contraseña',
          `
          <p>Hola ${user.nombres.split(' ')[0]},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace vence en 15 minutos:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Token (para soporte o si se solicita manualmente):</p>
          <pre style="padding:8px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;">${token}</pre>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
          `,
        );
        email_sent = res.ok;
      }
    }catch{}
    const link_dev = process.env.NODE_ENV === 'development' ? resetLink : undefined;
    return { ok: true, email_sent, token_dev: process.env.NODE_ENV === 'development' ? token : undefined, link_dev };
  }

  async confirmPasswordReset(dto: ConfirmResetDto) {
    const token_hash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const { rows } = await query<{ cedula: string }>(
      `select cedula from usuario.tokens_recuperacion
        where token_hash = $1 and usado_en is null and expira_en > now()
        order by created_at desc limit 1`,
      [token_hash],
    );
    const row = rows[0];
    if (!row) throw new BadRequestException('token inválido o expirado');
    const new_hash = await this.pwd.hash(dto.new_password);
    await query(`update usuario.usuarios set password_hash = $1 where cedula = $2`, [new_hash, row.cedula]);
    await query(`update usuario.tokens_recuperacion set usado_en = now() where token_hash = $1`, [token_hash]);
    await this.audit.log({ cedula: row.cedula, modulo: 'LOGIN', accion: 'PASSWORD_RESET_OK' });
    return { ok: true };
  }

  async refresh(refresh_token: string) {
    // verificar token y existencia de sesión activa (hash) no revocada/expirada
    let payload: any;
    try {
      payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'dev_refresh');
    } catch {
      throw new UnauthorizedException('refresh inválido');
    }
    const refresh_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    const active = await findActiveSessionByHash(refresh_hash);
    if (!active || active.cedula !== payload.sub) throw new UnauthorizedException('refresh inválido');
    const roles = await getUserRoles(payload.sub);
    const access = this.jwt.signAccess({ sub: payload.sub, roles });
    return { access_token: access };
  }
}
