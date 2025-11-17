import { Controller, Post, Body, Req, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async getProfile(@CurrentUser() user: any) {
    return {
      user,
    };
  }
}
