import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogPublicController } from './catalog.public.controller';

@Module({ controllers:[CatalogController, CatalogPublicController], providers:[CatalogService] })
export class CatalogModule {}
