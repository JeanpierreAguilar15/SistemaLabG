import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { RequestResetDto } from './dtos/request-reset.dto';
import { ConfirmResetDto } from './dtos/confirm-reset.dto';
import { RefreshDto } from './dtos/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // registro de paciente (RF-01)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // login (RF-02), auditar fallidos/ok
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    const user_agent = req.headers['user-agent'] || '';
    const fwd = req.headers['x-forwarded-for'] as string | undefined;
    const ip = (fwd ? fwd.split(',')[0].trim() : '') || req.ip || req.socket?.remoteAddress || '';
    return this.auth.login(dto, { ip, user_agent });
  }

  // solicitar recuperación (RF-03)
  @Post('password/request')
  requestReset(@Body() dto: RequestResetDto) {
    return this.auth.requestPasswordReset(dto);
  }

  // confirmar recuperación (RF-03)
  @Post('password/confirm')
  confirmReset(@Body() dto: ConfirmResetDto) {
    return this.auth.confirmPasswordReset(dto);
  }

  // cierre de sesión global (RF-05)
  @Post('logout-all')
  @UseGuards(require('../../common/guards/jwt-auth.guard').JwtAuthGuard)
  logoutAll(@Req() req: any) {
    return this.auth.logoutGlobal(req.user?.sub);
  }

  // refresh de access token (HT-4)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refresh_token);
  }

  // endpoint de prueba para forzar errores y probar auditoria.tb_error
  @Post('test-error')
  testError(@Req() req: any) {
    const user_agent = req.headers['user-agent'] || '';
    const fwd = req.headers['x-forwarded-for'] as string | undefined;
    const ip = (fwd ? fwd.split(',')[0].trim() : '') || req.ip || req.socket?.remoteAddress || '';
    throw new Error(`Error de prueba desde login - IP: ${ip}, UA: ${user_agent}`);
  }
}
