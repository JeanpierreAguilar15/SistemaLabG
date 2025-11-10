import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { IsCedulaEcuador } from '../../../common/validators/cedula-ecuador.validator';

export class CreateUserDto {
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

  @IsOptional()
  @IsString()
  @Length(8, 100)
  password?: string;

  @IsOptional()
  @IsString()
  rol?: string;
}

