import { handle } from 'hono/vercel';
import app from './index';

// The Vercel serverless entry. `pnpm build:server` bundles this file (and all of
// src/server) into dist-server/entry.mjs with esbuild; the committed shim at
// api/[[...route]].mjs re-exports that bundle. This keeps @vercel/node from ever
// compiling TypeScript — our native TS 7 toolchain isn't compatible with its
// classic `typescript` API (it crashes on `typescript.sys.readFile`).
export default handle(app);
