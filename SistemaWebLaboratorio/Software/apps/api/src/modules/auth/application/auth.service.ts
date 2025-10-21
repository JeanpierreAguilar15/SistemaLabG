import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsuarioEntity } from '../../users/infrastructure/usuario.entity';
import { RestablecimientoEntity } from '../infrastructure/restablecimiento.entity';
import { randomBytes } from 'crypto';
import { EmailService } from '../../notificaciones/email.service';
import { RolEntity } from '../../users/infrastructure/rol.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(UsuarioEntity)
    private readonly usuariosRepo: Repository<UsuarioEntity>,
    @InjectRepository(RestablecimientoEntity)
    private readonly restableRepo: Repository<RestablecimientoEntity>,
    @InjectRepository(RolEntity)
    private readonly rolesRepo: Repository<RolEntity>,
    private readonly email: EmailService,
  ) {}

  async login(correo: string, contrasena: string) {
    const usuario = await this.usuariosRepo.findOne({ where: { correo } });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(contrasena, usuario.hashContrasena);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const roles = (usuario.roles || []).map((r) => r.nombre);
    const payload = { sub: usuario.id, correo: usuario.correo, roles };
    return { access_token: this.jwt.sign(payload) };
  }

  async me(id: string) {
    const usuario = await this.usuariosRepo.findOne({ where: { id } });
    const roles = (usuario?.roles || []).map((r) => r.nombre);
    return { id: usuario?.id, correo: usuario?.correo, roles };
  }

  async solicitarRecuperacion(correo: string) {
    const usuario = await this.usuariosRepo.findOne({ where: { correo } });
    // Siempre responder 200 para no filtrar si existe; pero en dev devolvemos token
    if (!usuario) {
      return { mensaje: 'Si el correo existe, se envió el enlace de recuperación.' };
    }
    // invalidar tokens anteriores no usados
    await this.restableRepo
      .createQueryBuilder()
      .update(RestablecimientoEntity)
      .set({ usadoEn: new Date() })
      .where('usuario_id = :usuarioId AND usado_en IS NULL', { usuarioId: usuario.id })
      .execute();

    const token = randomBytes(32).toString('hex');
    const ahora = new Date();
    const expira = new Date(ahora.getTime() + 60 * 60 * 1000); // 1h
    const rec = this.restableRepo.create({
      usuario,
      token,
      creadoEn: ahora,
      expiraEn: expira,
    });
    await this.restableRepo.save(rec);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3001';
    const link = `${frontend}/restablecer?token=${token}`;
    const mail = await this.email.sendPasswordReset(usuario.correo, link);

    const response: any = { mensaje: 'Se generó el enlace de recuperación.' };
    // Solo mostramos token/preview en modo desarrollo o si se usó fallback
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!smtpConfigured || mail.usedFallback) {
      response.token = token;
      if (mail.previewUrl) response.previewEmail = mail.previewUrl;
    }
    return response;
  }

  async restablecerContrasena(token: string, nuevaContrasena: string) {
    const rec = await this.restableRepo.findOne({ where: { token }, relations: ['usuario'] });
    if (!rec) throw new NotFoundException('Token inválido');
    if (rec.usadoEn) throw new BadRequestException('Token ya utilizado');
    if (rec.expiraEn.getTime() < Date.now()) throw new BadRequestException('Token expirado');

    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await this.usuariosRepo.update({ id: rec.usuario.id }, { hashContrasena: hash });
    rec.usadoEn = new Date();
    await this.restableRepo.save(rec);

    return { mensaje: 'Contraseña actualizada' };
  }

  async register(data: { correo: string; contrasena: string; nombre?: string; apellido?: string; cedula: string; telefono?: string; fecha_nacimiento?: string }) {
    const exists = await this.usuariosRepo.findOne({ where: { correo: data.correo } });
    if (exists) throw new BadRequestException('El correo ya está registrado');

    const hash = await bcrypt.hash(data.contrasena, 10);
    const user = this.usuariosRepo.create({
      correo: data.correo,
      hashContrasena: hash,
      nombre: data.nombre || null,
      apellido: data.apellido || null,
      cedula: data.cedula,
      telefono: data.telefono || null,
      fechaNacimiento: (data.fecha_nacimiento as any) || null,
      activo: true,
    });
    // Asignar rol PACIENTE por defecto
    const rolPaciente = await this.rolesRepo.findOne({ where: { nombre: 'PACIENTE' } });
    if (rolPaciente) {
      user.roles = [rolPaciente];
    }
    const saved = await this.usuariosRepo.save(user);

    const payload = { sub: saved.id, correo: saved.correo, roles: (saved.roles || []).map((r) => r.nombre) };
    return { access_token: this.jwt.sign(payload) };
  }
}
