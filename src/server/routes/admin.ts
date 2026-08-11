import { Hono } from 'hono';
import { WishDraftSchema } from '../../entities/wish/model/schema';
import * as q from '../queries';
import { errors } from '../middleware/error';
import { requireOwner } from '../lib/owner';

/**
 * Owner (admin) routes. Every response is a plain wish — the reservation fields
 * are PHYSICALLY ABSENT from what these queries return, so booking data can never
 * reach the owner's UI. Guarded by the owner cookie.
 */
export const adminRoutes = new Hono();

adminRoutes.use('*', requireOwner);

adminRoutes.get('/wishlists/:slug/wishes', async (c) => {
  const wishes = await q.listAdminWishes(c.req.param('slug'));
  if (wishes === null) {
    throw errors.notFound('Wishlist not found');
  }
  return c.json(wishes);
});

adminRoutes.post('/wishlists/:slug/wishes', async (c) => {
  const parsed = WishDraftSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw errors.validation('Invalid wish');
  }
  const created = await q.createWish(c.req.param('slug'), parsed.data);
  if (!created) {
    throw errors.notFound('Wishlist not found');
  }
  return c.json(created, 201);
});

adminRoutes.patch('/wishes/:id', async (c) => {
  const parsed = WishDraftSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw errors.validation('Invalid wish');
  }
  const updated = await q.updateWish(c.req.param('id'), parsed.data);
  if (!updated) {
    throw errors.notFound('Wish not found');
  }
  return c.json(updated);
});

adminRoutes.delete('/wishes/:id', async (c) => {
  await q.deleteWish(c.req.param('id'));
  return c.body(null, 204);
});
