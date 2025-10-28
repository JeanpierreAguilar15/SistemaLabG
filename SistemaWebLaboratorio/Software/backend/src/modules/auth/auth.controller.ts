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
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
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
}
