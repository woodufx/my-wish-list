import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { z } from 'zod';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { envSchema } from './src/shared/config/env.schema.ts';
import { apiPlugin } from './src/server/vite.ts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Fail the build/dev start in Node if the environment is invalid, with a
  // readable message, instead of surfacing `undefined` in the browser runtime.
  const rawEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/pages',
        generatedRouteTree: './src/routeTree.gen.ts',
      }),
      react(),
      tailwindcss(),
      apiPlugin(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
