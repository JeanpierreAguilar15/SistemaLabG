import { IsBoolean, IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { IsCedulaEcuador } from '../../../common/validators/cedula-ecuador.validator';

export class RegisterDto {
  @IsString()
  @Length(10, 10)
  @IsCedulaEcuador()
  cedula!: string;

  @IsString()
  nombres!: string;

  @IsString()
  apellidos!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsString()
  @Length(8, 100)
  password!: string;

  @IsOptional()
  @IsBoolean()
  acepta_terminos?: boolean;
}
