import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog/public')
export class CatalogPublicController {
  constructor(private readonly svc: CatalogService) {}
  @Get('services')
  list(){ return this.svc.listActive(); }
}

