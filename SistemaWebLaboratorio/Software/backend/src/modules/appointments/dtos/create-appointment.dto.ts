import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

/**
 * DTO para crear una cita
 * RF-11: Solicitar turno y confirmarlo
 */
export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @IsString()
  @IsNotEmpty()
  codigo_servicio: string;

  @IsInt()
  @IsNotEmpty()
  slot_id: number;

  @IsString()
  @IsOptional()
  estado?: string; // CONFIRMADA, PENDIENTE
}
