import {
  IsInt,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear la relación entre un examen y un insumo
 */
export class CreateExamenInsumoDto {
  @ApiProperty({
    description: 'Código del examen',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  codigo_examen: number;

  @ApiProperty({
    description: 'Código del item de inventario (insumo)',
    example: 5,
  })
  @IsInt()
  @IsNotEmpty()
  codigo_item: number;

  @ApiProperty({
    description: 'Cantidad de insumo necesaria por examen',
    example: 2,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  cantidad_necesaria: number;

  @ApiProperty({
    description: 'Si el insumo es crítico (sin stock no se puede realizar el examen)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  es_critico?: boolean;
}

/**
 * DTO para actualizar la relación entre un examen y un insumo
 */
export class UpdateExamenInsumoDto {
  @ApiProperty({
    description: 'Cantidad de insumo necesaria por examen',
    example: 3,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  cantidad_necesaria?: number;

  @ApiProperty({
    description: 'Si el insumo es crítico',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  es_critico?: boolean;
}

/**
 * DTO para agregar múltiples insumos a un examen
 */
export class AddMultipleInsumosDto {
  @ApiProperty({
    description: 'Código del examen',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  codigo_examen: number;

  @ApiProperty({
    description: 'Lista de insumos con cantidades',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        codigo_item: { type: 'number', example: 5 },
        cantidad_necesaria: { type: 'number', example: 2 },
        es_critico: { type: 'boolean', example: true },
      },
    },
  })
  @IsNotEmpty()
  insumos: Array<{
    codigo_item: number;
    cantidad_necesaria: number;
    es_critico?: boolean;
  }>;
}

/**
 * DTO de respuesta para verificar disponibilidad de stock
 */
export class VerificarStockResponseDto {
  @ApiProperty({
    description: 'Si hay stock suficiente para realizar el examen',
  })
  tiene_stock_suficiente: boolean;

  @ApiProperty({
    description: 'Lista de insumos con información de stock',
    type: 'array',
  })
  insumos: Array<{
    codigo_item: number;
    nombre_item: string;
    cantidad_necesaria: number;
    stock_actual: number;
    es_critico: boolean;
    tiene_stock: boolean;
  }>;

  @ApiProperty({
    description: 'Insumos faltantes',
    type: 'array',
  })
  insumos_faltantes: Array<{
    codigo_item: number;
    nombre_item: string;
    cantidad_faltante: number;
    es_critico: boolean;
  }>;
}
