import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del rol es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El nivel de acceso debe ser al menos 1' })
  @Max(3, { message: 'El nivel de acceso no puede exceder 3' })
  nivel_acceso?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  nivel_acceso?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
