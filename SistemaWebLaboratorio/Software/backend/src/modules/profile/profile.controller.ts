import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UpsertConsentDto } from './dtos/upsert-consent.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly svc: ProfileService) {}

  @Get('me')
  me(@Req() req: any) { return this.svc.getMe(req.user.sub); }

  @Patch('me')
  update(@Req() req: any, @Body() dto: UpdateProfileDto) { return this.svc.updateMe(req.user.sub, dto); }

  @Post('consent')
  consent(@Req() req: any, @Body() dto: UpsertConsentDto) { return this.svc.upsertConsent(req.user.sub, dto.tipo_consentimiento, dto.aceptado); }

  @Post('change-password')
  changePass(@Req() req: any, @Body() dto: ChangePasswordDto) { return this.svc.changePassword(req.user.sub, dto); }

  @Get('history')
  history(@Req() req: any) { return this.svc.history(req.user.sub); }
}

