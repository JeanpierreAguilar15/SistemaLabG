import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service';
import { SystemConfigService } from '../../system-config/system-config.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /**
   * Register a new patient user
   */
  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const { cedula, email, password, nombres, apellidos, telefono, fecha_nacimiento, genero } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ cedula }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.cedula === cedula) {
        throw new ConflictException('La cédula ya está registrada');
      }
      if (existingUser.email === email) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    // Get PACIENTE role
    const pacienteRole = await this.prisma.rol.findFirst({
      where: { nombre: 'PACIENTE' },
    });

    if (!pacienteRole) {
      throw new BadRequestException('Rol PACIENTE no encontrado en el sistema');
    }

    // Hash password with configurable salt rounds
    const saltRounds = await this.systemConfigService.getNumber('AUTH_BCRYPT_SALT_ROUNDS', 10);
    const salt = await bcrypt.genSalt(saltRounds);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const usuario = await this.prisma.usuario.create({
      data: {
        codigo_rol: pacienteRole.codigo_rol,
        cedula,
        email,
        nombres,
        apellidos,
        telefono,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        genero,
        password_hash,
        salt,
        ip_ultima_conexion: ipAddress,
      },
      include: {
        rol: true,
      },
    });

    // Create default medical profile
    await this.prisma.perfilMedico.create({
      data: {
        codigo_usuario: usuario.codigo_usuario,
      },
    });

    // Create default consents
    await this.prisma.consentimiento.createMany({
      data: [
        {
          codigo_usuario: usuario.codigo_usuario,
          tipo_consentimiento: 'USO_DATOS',
          aceptado: true,
          version_politica: '1.0',
        },
        {
          codigo_usuario: usuario.codigo_usuario,
          tipo_consentimiento: 'NOTIFICACIONES',
          aceptado: true,
          version_politica: '1.0',
        },
      ],
    });

    // Generate tokens
    const tokens = await this.generateTokens(usuario.codigo_usuario, ipAddress, userAgent);

    // Log activity
    await this.logActivity(
      usuario.codigo_usuario,
      'REGISTRO',
      'Usuario',
      usuario.codigo_usuario,
      'Usuario registrado exitosamente',
      ipAddress,
      userAgent,
      null,
      {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
      },
    );

    return {
      user: {
        codigo_usuario: usuario.codigo_usuario,
        cedula: usuario.cedula,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol.nombre,
      },
      ...tokens,
    };
  }

  /**
   * Login user (email or cedula + password)
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { identifier, password } = loginDto;

    // Find user by email or cedula
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: identifier }, { cedula: identifier }],
      },
      include: {
        rol: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Check if account is blocked
    if (usuario.cuenta_bloqueada) {
      // Check if lockout time has passed
      const tiempoBloqueoMinutos = await this.systemConfigService.getNumber('AUTH_TIEMPO_BLOQUEO_MINUTOS', 30);
      if (usuario.fecha_bloqueo) {
        const tiempoTranscurrido = Date.now() - usuario.fecha_bloqueo.getTime();
        const tiempoBloqueoMs = tiempoBloqueoMinutos * 60 * 1000;

        if (tiempoTranscurrido >= tiempoBloqueoMs) {
          // Auto-unlock account
          await this.prisma.usuario.update({
            where: { codigo_usuario: usuario.codigo_usuario },
            data: {
              cuenta_bloqueada: false,
              fecha_bloqueo: null,
              intentos_fallidos: 0,
            },
          });
        } else {
          const minutosRestantes = Math.ceil((tiempoBloqueoMs - tiempoTranscurrido) / 60000);
          throw new UnauthorizedException(
            `Cuenta bloqueada. Intente de nuevo en ${minutosRestantes} minutos`,
          );
        }
      } else {
        throw new UnauthorizedException(
          `Cuenta bloqueada. Contacte al administrador o espere ${tiempoBloqueoMinutos} minutos`,
        );
      }
    }

    // Check if account is active
    if (!usuario.activo) {
      throw new UnauthorizedException('Cuenta desactivada. Contacte al administrador');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);

    if (!isPasswordValid) {
      // Increment failed attempts using configurable max
      const maxIntentos = await this.systemConfigService.getNumber('AUTH_MAX_INTENTOS_LOGIN', 5);
      const intentos = usuario.intentos_fallidos + 1;
      const bloqueado = intentos >= maxIntentos;

      await this.prisma.usuario.update({
        where: { codigo_usuario: usuario.codigo_usuario },
        data: {
          intentos_fallidos: intentos,
          cuenta_bloqueada: bloqueado,
          fecha_bloqueo: bloqueado ? new Date() : null,
        },
      });

      if (bloqueado) {
        const tiempoBloqueoMinutos = await this.systemConfigService.getNumber('AUTH_TIEMPO_BLOQUEO_MINUTOS', 30);
        throw new UnauthorizedException(
          `Cuenta bloqueada por exceder ${maxIntentos} intentos fallidos. Espere ${tiempoBloqueoMinutos} minutos`,
        );
      }

      throw new UnauthorizedException(`Credenciales inválidas. Intentos restantes: ${maxIntentos - intentos}`);
    }

    // Reset failed attempts
    await this.prisma.usuario.update({
      where: { codigo_usuario: usuario.codigo_usuario },
      data: {
        intentos_fallidos: 0,
        cuenta_bloqueada: false,
        fecha_bloqueo: null,
        ultima_conexion: new Date(),
        ip_ultima_conexion: ipAddress,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(usuario.codigo_usuario, ipAddress, userAgent);

    // Log activity
    await this.logActivity(
      usuario.codigo_usuario,
      'LOGIN',
      'Usuario',
      usuario.codigo_usuario,
      'Inicio de sesión exitoso',
      ipAddress,
      userAgent,
    );

    return {
      user: {
        codigo_usuario: usuario.codigo_usuario,
        cedula: usuario.cedula,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol.nombre,
        nivel_acceso: usuario.rol.nivel_acceso,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const sesion = await this.prisma.sesion.findFirst({
        where: {
          refresh_token: refreshToken,
          codigo_usuario: payload.sub,
          activo: true,
          revocado: false,
        },
      });

      if (!sesion) {
        throw new UnauthorizedException('Sesión inválida');
      }

      // Check if session expired
      if (new Date() > sesion.fecha_expiracion) {
        await this.prisma.sesion.update({
          where: { codigo_sesion: sesion.codigo_sesion },
          data: { activo: false },
        });
        throw new UnauthorizedException('Sesión expirada');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.sub, ipAddress, userAgent);

      // Revoke old session
      await this.prisma.sesion.update({
        where: { codigo_sesion: sesion.codigo_sesion },
        data: {
          activo: false,
          revocado: true,
          fecha_revocacion: new Date(),
        },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Token de actualización inválido');
    }
  }

  /**
   * Logout user
   */
  async logout(codigo_usuario: number, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.sesion.updateMany({
        where: {
          codigo_usuario,
          refresh_token: refreshToken,
        },
        data: {
          activo: false,
          revocado: true,
          fecha_revocacion: new Date(),
        },
      });
    } else {
      // Logout from all sessions
      await this.prisma.sesion.updateMany({
        where: {
          codigo_usuario,
          activo: true,
        },
        data: {
          activo: false,
          revocado: true,
          fecha_revocacion: new Date(),
        },
      });
    }

    // Log activity
    await this.logActivity(
      codigo_usuario,
      'LOGOUT',
      'Usuario',
      codigo_usuario,
      'Cierre de sesión',
    );

    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Validate user by codigo_usuario (used by JWT strategy)
   */
  async validateUser(codigo_usuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      codigo_usuario: usuario.codigo_usuario,
      cedula: usuario.cedula,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol.nombre,
      nivel_acceso: usuario.rol.nivel_acceso,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(codigo_usuario: number, ipAddress?: string, userAgent?: string) {
    const jti = uuidv4();

    // Get expiration times from system config or environment
    const accessExpiration = this.configService.get('JWT_ACCESS_EXPIRATION') ||
      await this.systemConfigService.getString('AUTH_JWT_ACCESS_EXPIRATION', '15m');
    const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION') ||
      await this.systemConfigService.getString('AUTH_JWT_REFRESH_EXPIRATION', '7d');

    const accessTokenPayload = {
      sub: codigo_usuario,
      jti,
      type: 'access',
    };

    const refreshTokenPayload = {
      sub: codigo_usuario,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiration,
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiration,
    });

    // Calculate expiration date from refresh expiration string
    const fecha_expiracion = this.calculateExpirationDate(refreshExpiration);

    // Store session in database
    await this.prisma.sesion.create({
      data: {
        codigo_usuario,
        refresh_token: refreshToken,
        access_token_jti: jti,
        ip_address: ipAddress,
        user_agent: userAgent,
        fecha_expiracion,
        activo: true,
      },
    });

    // Calculate access token expiration in seconds
    const expiresInSeconds = this.parseExpirationToSeconds(accessExpiration);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresInSeconds,
    };
  }

  /**
   * Parse expiration string (e.g., '15m', '7d', '1h') to Date
   */
  private calculateExpirationDate(expiration: string): Date {
    const fecha = new Date();
    const value = parseInt(expiration);
    const unit = expiration.slice(-1);

    switch (unit) {
      case 'm':
        fecha.setMinutes(fecha.getMinutes() + value);
        break;
      case 'h':
        fecha.setHours(fecha.getHours() + value);
        break;
      case 'd':
        fecha.setDate(fecha.getDate() + value);
        break;
      default:
        fecha.setDate(fecha.getDate() + 7); // Default 7 days
    }

    return fecha;
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const value = parseInt(expiration);
    const unit = expiration.slice(-1);

    switch (unit) {
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // Default 15 minutes
    }
  }

  /**
   * Log user activity
   */
  private async logActivity(
    codigo_usuario: number,
    accion: string,
    entidad?: string,
    codigo_entidad?: number,
    descripcion?: string,
    ipAddress?: string,
    userAgent?: string,
    datos_anteriores?: any,
    datos_nuevos?: any,
  ) {
    try {
      await this.prisma.logActividad.create({
        data: {
          codigo_usuario,
          accion,
          entidad,
          codigo_entidad,
          descripcion,
          ip_address: ipAddress,
          user_agent: userAgent,
          datos_anteriores,
          datos_nuevos,
        },
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
}
