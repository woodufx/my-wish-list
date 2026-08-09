import { z } from 'zod';
import { envSchema, type Env } from './env.schema';

/**
 * Environment variables validated at module load. An invalid `.env` throws here
 * — with a readable message — instead of leaking `undefined` into the runtime.
 * The same schema is validated at build time in `vite.config.ts`.
 */
const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env: Env = parsed.data;
export type { Env };
