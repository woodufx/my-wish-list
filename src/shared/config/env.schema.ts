import { z } from 'zod';

/**
 * Pure schema with NO side effects, so it can be imported both by the browser
 * runtime (`env.ts`, against `import.meta.env`) and by `vite.config.ts` (against
 * `loadEnv`) — the latter makes an invalid `.env` fail the build in Node.
 */
export const envSchema = z.object({
  /** Base URL of the API (real backend or the MSW mock origin). */
  VITE_API_BASE_URL: z.string().min(1, 'VITE_API_BASE_URL is required'),
  /** Whether MSW mocks should be started. Never enabled in production builds. */
  VITE_ENABLE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof envSchema>;
