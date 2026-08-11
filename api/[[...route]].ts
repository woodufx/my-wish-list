import { handle } from 'hono/vercel';
import app from '../src/server/index';

// Vercel catch-all function for every `/api/*` request. `handle` adapts the Hono
// app to the Web-standard `(Request) => Response` signature Vercel invokes. Runs
// on the Node.js runtime (default for `api/` functions) so `node:crypto` — used
// for guest-token hashing — is available.
export default handle(app);
