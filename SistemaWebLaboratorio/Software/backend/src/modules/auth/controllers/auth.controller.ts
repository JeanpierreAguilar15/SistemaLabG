import { Controller, Post, Body, Req, UseGuards, Get, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UpdateProfileDto, ChangePasswordDto, ConsentimientoDto } from '../dto/update-profile.dto';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Usuario ya existe' })
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    const ipAddress = request.ip || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const ipAddress = request.ip || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: Request) {
    const ipAddress = request.ip || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return this.authService.refreshToken(refreshTokenDto.refresh_token, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(@CurrentUser('codigo_usuario') codigo_usuario: number, @Body() body?: { refresh_token?: string }) {
    return this.authService.logout(codigo_usuario, body?.refresh_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Información del usuario' })
  async getMe(@CurrentUser() user: any) {
    return {
      user,
    };
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil completo del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  async getPerfil(@CurrentUser('codigo_usuario') codigo_usuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
      select: {
        codigo_usuario: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        email: true,
        telefono: true,
        direccion: true,
        fecha_nacimiento: true,
        genero: true,
        contacto_emergencia_nombre: true,
        contacto_emergencia_telefono: true,
      },
    });

    return usuario;
  }

  @Put('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  async updatePerfil(
    @CurrentUser('codigo_usuario') codigo_usuario: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // Remover campos que no deben actualizarse
    const { ...dataToUpdate } = updateProfileDto;

    // Convertir fecha si viene
    const updateData: any = { ...dataToUpdate };
    if (updateProfileDto.fecha_nacimiento) {
      updateData.fecha_nacimiento = new Date(updateProfileDto.fecha_nacimiento);
    }

    const usuario = await this.prisma.usuario.update({
      where: { codigo_usuario },
      data: updateData,
      select: {
        codigo_usuario: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        email: true,
        telefono: true,
        direccion: true,
        fecha_nacimiento: true,
        genero: true,
        contacto_emergencia_nombre: true,
        contacto_emergencia_telefono: true,
      },
    });

    return {
      message: 'Perfil actualizado correctamente',
      usuario,
    };
  }

  @Get('consentimientos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener consentimientos del usuario' })
  async getConsentimientos(@CurrentUser('codigo_usuario') codigo_usuario: number) {
    const consentimientos = await this.prisma.consentimiento.findMany({
      where: { codigo_usuario },
      select: {
        tipo_consentimiento: true,
        aceptado: true,
        fecha_consentimiento: true,
      },
    });

    return consentimientos;
  }

  @Post('consentimientos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar consentimientos del usuario' })
  async updateConsentimientos(
    @CurrentUser('codigo_usuario') codigo_usuario: number,
    @Body() consentimientos: ConsentimientoDto[],
  ) {
    // Upsert cada consentimiento
    for (const consent of consentimientos) {
      const existing = await this.prisma.consentimiento.findFirst({
        where: {
          codigo_usuario,
          tipo_consentimiento: consent.tipo,
        },
      });

      if (existing) {
        await this.prisma.consentimiento.update({
          where: { codigo_consentimiento: existing.codigo_consentimiento },
          data: {
            aceptado: consent.aceptado,
            fecha_consentimiento: new Date(),
          },
        });
      } else {
        await this.prisma.consentimiento.create({
          data: {
            codigo_usuario,
            tipo_consentimiento: consent.tipo,
            aceptado: consent.aceptado,
            version_politica: '1.0',
          },
        });
      }
    }

    return { message: 'Consentimientos actualizados correctamente' };
  }

  @Post('cambiar-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña del usuario' })
  async cambiarPassword(
    @CurrentUser('codigo_usuario') codigo_usuario: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
      select: { password_hash: true, salt: true },
    });

    if (!usuario) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    // Verificar contraseña actual
    const passwordHash = await bcrypt.hash(changePasswordDto.currentPassword, usuario.salt);
    if (passwordHash !== usuario.password_hash) {
      return { success: false, message: 'Contraseña actual incorrecta' };
    }

    // Generar nuevo hash
    const newSalt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(changePasswordDto.newPassword, newSalt);

    await this.prisma.usuario.update({
      where: { codigo_usuario },
      data: {
        password_hash: newHash,
        salt: newSalt,
      },
    });

    return { success: true, message: 'Contraseña cambiada correctamente' };
  }
}
