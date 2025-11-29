import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsUrl,
  Matches,
} from 'class-validator';

/**
 * Métodos de pago disponibles
 */
export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  OTRO = 'OTRO',
}

/**
 * DTO para registrar un pago
 */
export class CreatePagoDto {
  @ApiProperty({
    description: 'Código de la cotización asociada (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El código de cotización debe ser un número entero' })
  @Min(1, { message: 'El código de cotización debe ser mayor a 0' })
  codigo_cotizacion?: number;

  @ApiProperty({
    description: 'Monto total del pago',
    example: 150.75,
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @Max(999999.99, { message: 'El monto no puede exceder $999,999.99' })
  monto_total: number;

  @ApiProperty({
    description: 'Método de pago utilizado',
    enum: MetodoPago,
    example: MetodoPago.TRANSFERENCIA,
  })
  @IsEnum(MetodoPago, { message: 'Método de pago inválido' })
  metodo_pago: MetodoPago;

  @ApiProperty({
    description: 'Proveedor de pasarela de pago (PayPal, Stripe, etc.)',
    example: 'Stripe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El proveedor debe ser texto' })
  @MaxLength(50, { message: 'El proveedor no puede exceder 50 caracteres' })
  proveedor_pasarela?: string;

  @ApiProperty({
    description: 'ID de transacción externa (de la pasarela de pago)',
    example: 'pi_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El ID de transacción debe ser texto' })
  @MaxLength(255, { message: 'El ID de transacción no puede exceder 255 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'El ID de transacción solo puede contener letras, números, guiones y guiones bajos'
  })
  id_transaccion_externa?: string;

  @ApiProperty({
    description: 'URL del comprobante de pago',
    example: '/uploads/pagos/comprobante-123.pdf',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La URL debe ser texto' })
  @MaxLength(500, { message: 'La URL no puede exceder 500 caracteres' })
  url_comprobante?: string;

  @ApiProperty({
    description: 'Observaciones adicionales',
    example: 'Pago confirmado por transferencia bancaria',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observaciones?: string;
}
