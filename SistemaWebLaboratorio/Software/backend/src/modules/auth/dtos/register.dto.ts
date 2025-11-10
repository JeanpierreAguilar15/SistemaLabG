import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: 'La contrasena debe incluir mayusculas, minusculas y numeros' })
  password!: string;

  @IsOptional()
  @IsBoolean()
  acepta_terminos?: boolean;
}

