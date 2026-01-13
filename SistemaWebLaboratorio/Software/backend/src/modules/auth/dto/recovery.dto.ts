import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'paciente@example.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;
}

export class VerifyRecoveryCodeDto {
  @ApiProperty({ example: 'paciente@example.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código de recuperación de 6 dígitos' })
  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  codigo: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'paciente@example.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código de verificación de 6 dígitos' })
  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  codigo: string;

  @ApiProperty({ example: 'NewPassword123', description: 'Nueva contraseña (mínimo 8 caracteres, una mayúscula, una minúscula y un número)' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword: string;
}
