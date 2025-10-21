import { IsEmail, IsOptional, IsString, MinLength, IsDateString, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(6)
  contrasena: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsString()
  @Matches(/^\d{10}$/)
  cedula: string; // 10 dígitos

  @IsOptional()
  @IsString()
  telefono?: string;

  // Enviar como 'YYYY-MM-DD'
  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;
}
