import { serve } from '@hono/node-server';
import app from './index';

// Standalone local API, separate from the Vite dev server. In dev, Vite proxies
// `/api` here (wired in stage 6); on Vercel the same `app` runs as a function.
const port = Number(process.env.API_PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
