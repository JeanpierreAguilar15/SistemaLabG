import { Pool } from 'pg';

const defaultUrl = 'postgres://postgres:admin1234@localhost:5432/postgres';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || defaultUrl,
  max: 10,
});

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<{ rows: T[] }>{
  return db.query<T>(text, params as any);
}
