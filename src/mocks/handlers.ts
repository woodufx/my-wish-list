import { delay, http, HttpResponse } from 'msw';
import { WishDraftSchema } from '@/entities/wish';
import { DEMO_SLUG, wishlistFixture } from './fixtures';
import * as db from './db';

// Leading `*` matches any origin, so the same handlers work both in the browser
// (same-origin `/api`) and in Node tests (absolute `http://localhost/api`).
const BASE = '*/api';

/** Random latency in the 200–600 ms range, like a real network. */
function randomDelay(): Promise<void> {
  return delay(200 + Math.floor(Math.random() * 400));
}

/**
 * Failure injection for testing optimistic rollback. Enable per request with
 * `?scenario=conflict|error|timeout`, or globally via `localStorage['mock.scenario']`.
 */
function getScenario(request: Request): string | null {
  const fromQuery = new URL(request.url).searchParams.get('scenario');
  if (fromQuery) {
    return fromQuery;
  }
  try {
    return globalThis.localStorage?.getItem('mock.scenario') ?? null;
  } catch {
    return null;
  }
}

export const handlers = [
  http.get(`${BASE}/wishlists/:slug`, async ({ params }) => {
    await randomDelay();
    if (params.slug !== DEMO_SLUG) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Wishlist not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(wishlistFixture);
  }),

  http.get(`${BASE}/wishlists/:slug/wishes`, async ({ params, request }) => {
    await randomDelay();
    if (params.slug !== DEMO_SLUG) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Wishlist not found' },
        { status: 404 },
      );
    }
    const token = request.headers.get('X-Guest-Token');
    const list = db.listWishes().map((wish) => ({
      ...wish,
      reservationStatus: db.statusFor(wish.id, token),
    }));
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/wishes/:id`, async ({ params, request }) => {
    await randomDelay();
    const wish = db.findWish(String(params.id));
    if (!wish) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'Wish not found' }, { status: 404 });
    }
    const token = request.headers.get('X-Guest-Token');
    return HttpResponse.json({ ...wish, reservationStatus: db.statusFor(wish.id, token) });
  }),

  http.post(`${BASE}/wishes/:id/reservation`, async ({ params, request }) => {
    await randomDelay();
    const scenario = getScenario(request);
    if (scenario === 'error') {
      return HttpResponse.json({ code: 'INTERNAL', message: 'Server error' }, { status: 500 });
    }
    if (scenario === 'timeout') {
      await delay(15_000);
      return HttpResponse.json({ code: 'INTERNAL', message: 'Server error' }, { status: 500 });
    }
    const token = request.headers.get('X-Guest-Token');
    if (!token) {
      return HttpResponse.json(
        { code: 'NO_TOKEN', message: 'Missing guest token' },
        { status: 400 },
      );
    }
    const id = String(params.id);
    if (!db.findWish(id)) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'Wish not found' }, { status: 404 });
    }
    if (scenario === 'conflict') {
      return HttpResponse.json(
        { code: 'ALREADY_RESERVED', message: 'Already reserved by someone else' },
        { status: 409 },
      );
    }
    const result = db.reserve(id, token);
    if (!result.ok) {
      return HttpResponse.json(
        { code: 'ALREADY_RESERVED', message: 'Already reserved by someone else' },
        { status: 409 },
      );
    }
    return HttpResponse.json({ wishId: id, createdAt: result.createdAt }, { status: 201 });
  }),

  http.delete(`${BASE}/wishes/:id/reservation`, async ({ params, request }) => {
    await randomDelay();
    const token = request.headers.get('X-Guest-Token');
    if (!token) {
      return HttpResponse.json(
        { code: 'NO_TOKEN', message: 'Missing guest token' },
        { status: 400 },
      );
    }
    db.cancel(String(params.id), token);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/me/reservations`, async ({ request }) => {
    await randomDelay();
    const token = request.headers.get('X-Guest-Token');
    const list = db.myReservations(token).map(({ wish, createdAt }) => ({
      wish: { ...wish, reservationStatus: 'taken_by_me' as const },
      createdAt,
    }));
    return HttpResponse.json(list);
  }),

  // --- Admin (owner) endpoints: return plain wishes, NEVER reservation data ---

  http.get(`${BASE}/admin/wishlists/:slug/wishes`, async () => {
    await randomDelay();
    return HttpResponse.json(db.listWishes());
  }),

  http.post(`${BASE}/admin/wishlists/:slug/wishes`, async ({ request }) => {
    await randomDelay();
    const body: unknown = await request.json();
    const parsed = WishDraftSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ code: 'VALIDATION', message: 'Invalid wish' }, { status: 400 });
    }
    return HttpResponse.json(db.createWish(parsed.data), { status: 201 });
  }),

  http.patch(`${BASE}/admin/wishes/:id`, async ({ params, request }) => {
    await randomDelay();
    const body: unknown = await request.json();
    const parsed = WishDraftSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ code: 'VALIDATION', message: 'Invalid wish' }, { status: 400 });
    }
    const updated = db.updateWish(String(params.id), parsed.data);
    if (!updated) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'Wish not found' }, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/admin/wishes/:id`, async ({ params }) => {
    await randomDelay();
    db.deleteWish(String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
];
