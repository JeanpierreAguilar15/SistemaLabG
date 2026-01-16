import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '@modules/usuarios/usuarios.service';
import { NotificacionesService } from '@modules/notificaciones/notificaciones.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usuariosService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const usuario = await this.usuariosService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const token = this.generateToken(usuario);

    return {
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const usuario = await this.usuariosService.findByEmail(loginDto.email);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, usuario.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const token = this.generateToken(usuario);

    return {
      message: 'Login exitoso',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
      token,
    };
  }

  async forgotPassword(email: string) {
    const usuario = await this.usuariosService.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!usuario) {
      return { message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña' };
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = this.jwtService.sign(
      { sub: usuario.id, email: usuario.email, type: 'password-reset' },
      { expiresIn: '1h' }
    );

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    // Send email
    await this.notificacionesService.enviarRecuperacionPassword(
      usuario.email,
      {
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        resetUrl,
      }
    );

    return { message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Token inválido');
      }

      const usuario = await this.usuariosService.findById(payload.sub);
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usuariosService.updatePassword(usuario.id, hashedPassword);

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('El enlace de recuperación ha expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token inválido');
      }
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const usuario = await this.usuariosService.findByIdWithPassword(userId);

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, usuario.password);
    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usuariosService.updatePassword(userId, hashedPassword);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  private generateToken(usuario: any): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
    return this.jwtService.sign(payload);
  }
}
