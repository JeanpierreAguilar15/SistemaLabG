import { IsString, IsInt, IsOptional } from 'class-validator';

/**
 * DTO para actualizar una cita
 * RF-12: Reprogramar turno
 * RF-13: Cancelar turno con motivo
 */
export class UpdateAppointmentDto {
  @IsInt()
  @IsOptional()
  slot_id?: number;

  @IsString()
  @IsOptional()
  estado?: string; // CONFIRMADA, PENDIENTE, COMPLETADA, CANCELADA

  @IsString()
  @IsOptional()
  motivo_cancelacion?: string;
}
