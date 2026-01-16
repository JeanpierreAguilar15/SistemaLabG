import { IsString, IsDateString, IsOptional, IsUUID, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservaDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID de la cancha' })
  @IsUUID('4', { message: 'ID de cancha invalido' })
  canchaId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de la reserva (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Fecha invalida. Formato esperado: YYYY-MM-DD' })
  fecha: string;

  @ApiProperty({ example: '10:00', description: 'Hora de inicio (HH:mm)' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Hora de inicio invalida. Formato esperado: HH:mm' })
  horaInicio: string;

  @ApiProperty({ example: '11:00', description: 'Hora de fin (HH:mm)' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Hora de fin invalida. Formato esperado: HH:mm' })
  horaFin: string;

  @ApiPropertyOptional({ example: 'Partido amistoso', description: 'Notas adicionales' })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(500, { message: 'Las notas no pueden tener mas de 500 caracteres' })
  notas?: string;
}
