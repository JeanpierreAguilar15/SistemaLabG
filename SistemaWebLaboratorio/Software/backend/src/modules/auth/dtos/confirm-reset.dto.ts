import { IsString, Length } from 'class-validator';

export class ConfirmResetDto {
  @IsString()
  token!: string;

  @IsString()
  @Length(8, 100)
  new_password!: string;
}

