import { IsNotEmpty, IsString, IsInt, IsDateString, Min } from 'class-validator';

/**
 * DTO para generar slots automáticos
 * RF-15: Administrar cupos y bloques horarios
 */
export class GenerateSlotsDto {
  @IsString()
  @IsNotEmpty()
  codigo_servicio: string;

  @IsString()
  @IsNotEmpty()
  codigo_sede: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_fin: string;

  @IsInt()
  @Min(1)
  paso_minutos: number; // Duración de cada slot en minutos

  @IsInt()
  @Min(1)
  cupo_por_slot: number; // Cupo por cada slot generado
}
