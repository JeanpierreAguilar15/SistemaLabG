import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../infrastructure/jwt-auth.guard';
import { SolicitarRecuperacionDto } from './dto/solicitar-recuperacion.dto';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto';
import { Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.correo, dto.contrasena);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.sub);
  }

  @Post('recuperar')
  @Throttle({ recuperar: { limit: 3, ttl: 60 } })
  solicitar(@Body() dto: SolicitarRecuperacionDto) {
    return this.auth.solicitarRecuperacion(dto.correo);
  }

  @Post('restablecer')
  restablecer(@Body() dto: RestablecerContrasenaDto) {
    return this.auth.restablecerContrasena(dto.token, dto.nuevaContrasena);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register({
      correo: dto.correo,
      contrasena: dto.contrasena,
      nombre: dto.nombre,
      apellido: dto.apellido,
      cedula: dto.cedula,
      telefono: dto.telefono,
      fecha_nacimiento: dto.fecha_nacimiento,
    });
  }
}
