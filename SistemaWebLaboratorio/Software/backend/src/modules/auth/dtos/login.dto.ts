import { IsOptional, IsString, Length } from 'class-validator';
import { IsCedulaEcuador } from '../../../common/validators/cedula-ecuador.validator';

export class LoginDto {
  @IsString()
  @Length(10, 10)
  @IsCedulaEcuador()
  cedula!: string;

  @IsString()
  @Length(8, 100)
  password!: string;

  // Campos tolerados por compatibilidad con clientes antiguos; ignorados en backend
  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @IsString()
  ip?: string;
}
