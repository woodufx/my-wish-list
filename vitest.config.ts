import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Standalone (does not merge vite.config, which is a callback): tests only need
// JSX transform and the `@` alias.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Node's fetch needs an absolute URL; MSW matches by pathname. Mocks are
    // driven manually via the Node server in tests, so auto-start is off.
    env: {
      VITE_API_BASE_URL: 'http://localhost/api',
      VITE_ENABLE_MOCKS: 'false',
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/routeTree.gen.ts',
        'src/mocks/**',
      ],
    },
  },
});
