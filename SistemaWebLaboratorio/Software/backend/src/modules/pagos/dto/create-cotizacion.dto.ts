import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para un examen seleccionado en la cotización
 */
export class ExamenCotizadoDto {
  @ApiProperty({
    description: 'Código del examen',
    example: 1,
  })
  @IsInt({ message: 'El código del examen debe ser un número entero' })
  @Min(1, { message: 'El código del examen debe ser mayor a 0' })
  codigo_examen: number;

  @ApiProperty({
    description: 'Cantidad de exámenes (normalmente 1)',
    example: 1,
    default: 1,
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  @Max(10, { message: 'La cantidad máxima por examen es 10' })
  cantidad: number = 1;
}

/**
 * DTO para crear una cotización
 * El paciente selecciona exámenes tipo checklist y el sistema calcula el precio automáticamente
 */
export class CreateCotizacionDto {
  @ApiProperty({
    description: 'Lista de exámenes seleccionados con sus cantidades',
    type: [ExamenCotizadoDto],
    example: [
      { codigo_examen: 1, cantidad: 1 },
      { codigo_examen: 5, cantidad: 1 },
    ],
  })
  @IsArray({ message: 'Los exámenes deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un examen' })
  @ArrayMaxSize(50, { message: 'No puede seleccionar más de 50 exámenes' })
  @ValidateNested({ each: true })
  @Type(() => ExamenCotizadoDto)
  examenes: ExamenCotizadoDto[];

  @ApiProperty({
    description: 'Descuento a aplicar (opcional, solo Admin)',
    example: 10.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  @Max(100, { message: 'El descuento máximo es del 100%' })
  descuento?: number;

  @ApiProperty({
    description: 'Observaciones adicionales',
    example: 'Solicitud de exámenes pre-operatorios',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observaciones?: string;
}
