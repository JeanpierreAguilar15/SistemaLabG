import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';

export class CreatePagoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID de la reserva' })
  @IsUUID('4', { message: 'ID de reserva invalido' })
  reservaId: string;

  @ApiProperty({ enum: MetodoPago, example: 'TARJETA', description: 'Metodo de pago' })
  @IsEnum(MetodoPago, { message: 'Metodo de pago invalido. Valores permitidos: EFECTIVO, TARJETA, TRANSFERENCIA' })
  metodo: MetodoPago;
}
