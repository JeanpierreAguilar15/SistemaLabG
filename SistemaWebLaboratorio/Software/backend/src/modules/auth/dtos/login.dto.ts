import { IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(20)
  cedula!: string;

  @IsString()
  password!: string;

  @IsString()
  user_agent!: string;

  @IsString()
  ip!: string;
}

