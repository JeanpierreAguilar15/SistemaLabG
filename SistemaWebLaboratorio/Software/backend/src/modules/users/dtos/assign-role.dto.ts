import { IsIn, IsString, MaxLength } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @MaxLength(20)
  cedula!: string;

  @IsString()
  @IsIn(['PACIENTE', 'PERSONAL_LAB', 'ADMIN'])
  nombre_rol!: 'PACIENTE' | 'PERSONAL_LAB' | 'ADMIN';
}

