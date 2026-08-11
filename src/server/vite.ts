import type { Plugin } from 'vite';
import { getRequestListener } from '@hono/node-server';

/**
 * Mounts the Hono API as Vite dev-server middleware, so `/api/*` is served
 * in-process by the same app that runs on Vercel in production. Server-only env
 * (DATABASE_URL, OWNER_SECRET, COOKIE_SECRET) is loaded from `.env` here because
 * Vite only exposes `VITE_`-prefixed vars.
 *
 * NOTE: the Hono app is imported through Node (not Vite's module graph), so
 * changes to files under `src/server` need a dev-server restart to take effect.
 */
export function apiPlugin(): Plugin {
  return {
    name: 'wishlist-api',
    // Dev-only: on Vercel the same app runs as a function (api/[[...route]].ts),
    // so this must never pull the server graph into the client build.
    apply: 'serve',
    async configureServer(server) {
      try {
        process.loadEnvFile('.env');
      } catch {
        // No .env — rely on the ambient environment.
      }
      // Imported after env is loaded — `./index` validates the server env on load.
      const { default: app } = await import('./index');
      const listener = getRequestListener(app.fetch);
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api')) {
          void listener(req, res);
        } else {
          next();
        }
      });
    },
  };
}
