import { IsString, MinLength } from 'class-validator';

export class RestablecerContrasenaDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  nuevaContrasena: string;
}

