import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  current_password!: string;

  @IsString()
  @Length(8, 100)
  new_password!: string;
}

