import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, IsEmail } from 'class-validator';

/**
 * Respuesta estándar para Dialogflow CX
 */
export class DialogflowResponseDto<T = any> {
  @ApiProperty({ description: 'Indica si la operación fue exitosa' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Datos de la respuesta' })
  data?: T;

  @ApiProperty({ description: 'Mensaje descriptivo para el chatbot' })
  mensaje: string;

  @ApiPropertyOptional({ description: 'Código de error si aplica' })
  error_code?: string;
}

/**
 * DTO para agendar una cita
 */
export class AgendarCitaDto {
  @ApiProperty({ description: 'Fecha de la cita en formato YYYY-MM-DD', example: '2025-01-15' })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({ description: 'Hora de la cita en formato HH:MM', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  hora: string;

  @ApiProperty({ description: 'Cédula del paciente', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  cedula_paciente: string;

  @ApiPropertyOptional({ description: 'Nombre del examen o servicio', example: 'Hemograma Completo' })
  @IsString()
  @IsOptional()
  examen?: string;

  @ApiPropertyOptional({ description: 'Código del servicio', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  codigo_servicio?: number;

  @ApiPropertyOptional({ description: 'Código de la sede', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  codigo_sede?: number;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

/**
 * Respuesta de precio de examen
 */
export class PrecioExamenDto {
  @ApiProperty({ description: 'Nombre del examen' })
  nombre: string;

  @ApiProperty({ description: 'Precio actual en USD' })
  precio: number;

  @ApiProperty({ description: 'Moneda', example: 'USD' })
  moneda: string;

  @ApiPropertyOptional({ description: 'Categoría del examen' })
  categoria?: string;

  @ApiPropertyOptional({ description: 'Requiere ayuno' })
  requiere_ayuno?: boolean;

  @ApiPropertyOptional({ description: 'Horas de ayuno requeridas' })
  horas_ayuno?: number;
}

/**
 * Respuesta de valores de referencia
 */
export class RangoReferenciaDto {
  @ApiProperty({ description: 'Nombre del examen' })
  nombre: string;

  @ApiPropertyOptional({ description: 'Valor mínimo de referencia' })
  valor_min?: number;

  @ApiPropertyOptional({ description: 'Valor máximo de referencia' })
  valor_max?: number;

  @ApiPropertyOptional({ description: 'Unidad de medida' })
  unidad_medida?: string;

  @ApiPropertyOptional({ description: 'Descripción textual del rango (para valores cualitativos)' })
  valores_texto?: string;
}

/**
 * Horario disponible
 */
export class HorarioDisponibleDto {
  @ApiProperty({ description: 'ID del slot' })
  slot_id: number;

  @ApiProperty({ description: 'Hora de inicio', example: '09:00' })
  hora: string;

  @ApiProperty({ description: 'Cupos disponibles' })
  cupos: number;

  @ApiProperty({ description: 'Nombre de la sede' })
  sede: string;

  @ApiProperty({ description: 'Nombre del servicio' })
  servicio: string;
}

/**
 * Respuesta de disponibilidad
 */
export class DisponibilidadDto {
  @ApiProperty({ description: 'Fecha consultada' })
  fecha: string;

  @ApiProperty({ description: 'Total de horarios disponibles' })
  total_horarios: number;

  @ApiProperty({ type: [HorarioDisponibleDto], description: 'Lista de horarios disponibles' })
  horarios: HorarioDisponibleDto[];
}

/**
 * Información de cita
 */
export class CitaInfoDto {
  @ApiProperty({ description: 'Código único de la cita' })
  codigo_cita: number;

  @ApiProperty({ description: 'Fecha de la cita' })
  fecha: string;

  @ApiProperty({ description: 'Hora de la cita' })
  hora: string;

  @ApiProperty({ description: 'Servicio' })
  servicio: string;

  @ApiProperty({ description: 'Sede' })
  sede: string;

  @ApiProperty({ description: 'Estado de la cita' })
  estado: string;
}
