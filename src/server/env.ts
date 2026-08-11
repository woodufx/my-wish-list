import { z } from 'zod';

/**
 * Server-only environment, validated at module load. An invalid environment
 * throws here — with a readable message — instead of leaking `undefined` deep
 * into a request. These names carry NO `VITE_` prefix, so Vite never exposes
 * them to the client bundle.
 */
const serverEnvSchema = z.object({
  /** Neon Postgres connection string (HTTP driver). */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /** Long random secret that grants owner (admin) access. */
  OWNER_SECRET: z.string().min(16, 'OWNER_SECRET must be at least 16 characters'),
  /** Secret used to sign the owner cookie. */
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid server environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env: ServerEnv = parsed.data;
