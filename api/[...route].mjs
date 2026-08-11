// Committed plain-JS shim so Vercel's function builder never compiles TypeScript.
// The real handler is bundled by `pnpm build:server` into dist-server/entry.mjs.
export { default } from '../dist-server/entry.mjs';
