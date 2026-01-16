import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoCancha } from '@prisma/client';

export class UpdateCanchaDto {
  @ApiPropertyOptional({ example: 'Cancha de Futbol 1', description: 'Nombre de la cancha' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener mas de 100 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ enum: TipoCancha, example: 'FUTBOL', description: 'Tipo de cancha' })
  @IsOptional()
  @IsEnum(TipoCancha, { message: 'Tipo de cancha invalido. Valores permitidos: FUTBOL, TENIS, BASQUET' })
  tipo?: TipoCancha;

  @ApiPropertyOptional({ example: 'Cancha con cesped sintetico', description: 'Descripcion de la cancha' })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser un texto' })
  @MaxLength(500, { message: 'La descripcion no puede tener mas de 500 caracteres' })
  descripcion?: string;

  @ApiPropertyOptional({ example: 50, description: 'Precio por hora en dolares' })
  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un numero' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precioPorHora?: number;

  @ApiPropertyOptional({ example: true, description: 'Estado de la cancha' })
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  activa?: boolean;

  @ApiPropertyOptional({ example: 'imagen.jpg', description: 'Nombre del archivo de imagen' })
  @IsOptional()
  @IsString()
  imagen?: string;
}
