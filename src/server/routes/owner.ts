import { Hono } from 'hono';
import { errors } from '../middleware/error';
import { grantOwner, isOwner, revokeOwner, verifyOwnerSecret } from '../lib/owner';

/**
 * Owner session: the admin exchanges OWNER_SECRET for a signed httpOnly cookie.
 * Mounted at `/owner`, so these are `/api/owner/session`.
 */
export const ownerRoutes = new Hono();

ownerRoutes.get('/session', async (c) => c.json({ authenticated: await isOwner(c) }));

ownerRoutes.post('/session', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const secret =
    body && typeof body === 'object' && 'secret' in body && typeof body.secret === 'string'
      ? body.secret
      : '';
  if (!verifyOwnerSecret(secret)) {
    throw errors.unauthorized('Invalid secret');
  }
  await grantOwner(c);
  return c.json({ authenticated: true });
});

ownerRoutes.delete('/session', (c) => {
  revokeOwner(c);
  return c.json({ authenticated: false });
});
