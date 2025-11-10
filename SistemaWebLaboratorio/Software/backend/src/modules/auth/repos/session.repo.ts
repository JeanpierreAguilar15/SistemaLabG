import { query } from '../../../infra/db';

export async function createSession(params: {
  cedula: string;
  refresh_hash: string;
  expira_en: Date;
  ip_origen?: string | null;
  user_agent?: string | null;
}): Promise<number> {
  const { rows } = await query<{ token_id: number }>(
    `insert into usuario.sesiones (cedula, refresh_token_hash, expira_en, ip_origen, user_agent)
     values ($1,$2,$3,$4,$5)
     returning token_id`,
    [params.cedula, params.refresh_hash, params.expira_en, params.ip_origen ?? null, params.user_agent ?? null],
  );
  return rows[0].token_id;
}

export async function revokeAllSessions(cedula: string): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `update usuario.sesiones
        set revocado_en = now()
      where cedula = $1 and revocado_en is null
      returning 1 as count`,
    [cedula],
  );
  return rows.length;
}

export async function findActiveSessionByHash(refresh_hash: string): Promise<{ token_id: number; cedula: string } | null> {
  const { rows } = await query<{ token_id: number; cedula: string }>(
    `select token_id, cedula
       from usuario.sesiones
      where refresh_token_hash = $1
        and revocado_en is null
        and expira_en > now()
      limit 1`,
    [refresh_hash],
  );
  return rows[0] ?? null;
}
