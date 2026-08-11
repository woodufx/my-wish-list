import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../env';
import * as schema from './schema';

// Neon's HTTP driver — a plain fetch per query. No connection pool, which is the
// only thing that works under Vercel Functions' per-request lifecycle.
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export type Db = typeof db;
