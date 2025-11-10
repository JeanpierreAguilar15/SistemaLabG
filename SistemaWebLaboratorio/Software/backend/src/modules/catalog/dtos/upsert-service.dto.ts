import { IsNotEmpty, IsString, IsNumber, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

/**
 * DTO para crear o actualizar servicios del catálogo
 * RF-34: Mantener catálogo de insumos (adaptado para servicios de laboratorio)
 * HU-17: Gestión de Exámenes
 */
export class UpsertServiceDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  duracion_min?: number;

  @IsString()
  @IsOptional()
  instrucciones_preparacion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
