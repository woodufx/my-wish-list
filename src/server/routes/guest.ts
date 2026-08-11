import { Hono } from 'hono';
import * as q from '../queries';
import { errors } from '../middleware/error';

/** Guest-facing routes: browsing a list and reserving/releasing wishes. */
export const guestRoutes = new Hono();

guestRoutes.get('/wishlists/:slug', async (c) => {
  const wishlist = await q.getWishlist(c.req.param('slug'));
  if (!wishlist) {
    throw errors.notFound('Wishlist not found');
  }
  return c.json(wishlist);
});

guestRoutes.get('/wishlists/:slug/wishes', async (c) => {
  const token = c.req.header('X-Guest-Token') ?? null;
  const wishes = await q.listPublicWishes(c.req.param('slug'), token);
  if (wishes === null) {
    throw errors.notFound('Wishlist not found');
  }
  return c.json(wishes);
});

guestRoutes.get('/wishes/:id', async (c) => {
  const token = c.req.header('X-Guest-Token') ?? null;
  const wish = await q.getPublicWish(c.req.param('id'), token);
  if (!wish) {
    throw errors.notFound('Wish not found');
  }
  return c.json(wish);
});

guestRoutes.post('/wishes/:id/reservation', async (c) => {
  const token = c.req.header('X-Guest-Token');
  if (!token) {
    throw errors.noToken();
  }
  const id = c.req.param('id');
  const result = await q.reserve(id, token);
  if (result.notFound) {
    throw errors.notFound('Wish not found');
  }
  if (!result.ok) {
    throw errors.alreadyReserved();
  }
  return c.json({ wishId: id, createdAt: result.createdAt }, 201);
});

guestRoutes.delete('/wishes/:id/reservation', async (c) => {
  const token = c.req.header('X-Guest-Token');
  if (!token) {
    throw errors.noToken();
  }
  await q.cancel(c.req.param('id'), token);
  return c.body(null, 204);
});

guestRoutes.get('/me/reservations', async (c) => {
  const token = c.req.header('X-Guest-Token') ?? null;
  return c.json(await q.myReservations(token));
});
