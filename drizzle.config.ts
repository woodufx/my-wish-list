import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs this config in its own process, so load .env here (Node 24
// built-in) before reading the connection string.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file — rely on the ambient environment (e.g. CI / Vercel).
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required — set it in .env before running db:generate/db:migrate',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
