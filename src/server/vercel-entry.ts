import { getRequestListener } from '@hono/node-server';
import app from './index';

// The Vercel serverless entry, bundled to plain JS by `pnpm build:server` so
// @vercel/node never compiles TypeScript (our native TS 7 has no classic
// compiler API and crashes its builder). `getRequestListener` turns the Hono
// app into a Node `(req, res)` handler — the canonical Vercel function
// signature, and the same adapter the dev Vite middleware uses.
export default getRequestListener(app.fetch);
