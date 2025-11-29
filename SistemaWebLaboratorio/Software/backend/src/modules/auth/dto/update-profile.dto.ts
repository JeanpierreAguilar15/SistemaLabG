import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsIn,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombres?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidos?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  telefono?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsIn(['M', 'F', 'O'], { message: 'Género debe ser M, F u O' })
  genero?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contacto_emergencia_nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  contacto_emergencia_telefono?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  newPassword: string;
}

export class ConsentimientoDto {
  @ApiProperty()
  @IsString()
  tipo: string;

  @ApiProperty()
  aceptado: boolean;
}
