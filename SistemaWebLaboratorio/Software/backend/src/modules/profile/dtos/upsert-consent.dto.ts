import { IsBoolean, IsString } from 'class-validator';

export class UpsertConsentDto {
  @IsString()
  tipo_consentimiento!: string; // uso_datos, notificaciones

  @IsBoolean()
  aceptado!: boolean;
}

