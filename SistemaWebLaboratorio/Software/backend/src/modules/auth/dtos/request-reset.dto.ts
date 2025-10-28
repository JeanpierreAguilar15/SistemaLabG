import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RequestResetDto {
  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
