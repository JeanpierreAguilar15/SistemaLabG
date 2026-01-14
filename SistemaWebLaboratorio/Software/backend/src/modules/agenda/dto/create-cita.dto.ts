import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCitaDto {
  @ApiProperty({
    description: 'Código del slot a reservar',
    example: 1,
  })
  @IsInt()
  codigo_slot: number;

  @ApiPropertyOptional({
    description: 'Observaciones del paciente',
    example: 'Tengo alergia a la penicilina',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({
    description: 'Código de la cotización asociada (requerido para agendar)',
    example: 1,
  })
  @IsInt()
  codigo_cotizacion: number;
}
