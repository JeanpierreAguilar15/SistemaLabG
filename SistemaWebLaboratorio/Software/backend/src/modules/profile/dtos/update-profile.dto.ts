import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100)
  nombres?: string;

  @IsOptional() @IsString() @MaxLength(100)
  apellidos?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(100)
  telefono?: string;

  @IsOptional() @IsString()
  direccion?: string;

  @IsOptional() @IsString()
  contacto_emergencia_nombre?: string;

  @IsOptional() @IsString()
  contacto_emergencia_telefono?: string;
}
