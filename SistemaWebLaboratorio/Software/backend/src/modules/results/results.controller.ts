import { Controller, Get, Post, Query, Req, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ResultsService } from './results.service';

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private readonly svc: ResultsService) {}

  @Get()
  list(@Req() req: any, @Query('estado') estado?: string) {
    return this.svc.listMine(req.user.sub, estado);
  }

  @Post('pdf')
  pdf(@Req() req: any, @Body() body: { codigo_resultado: number }) {
    return this.svc.signPdfUrl(req.user.sub, body.codigo_resultado, req.ip, req.headers['user-agent']);
  }
}

