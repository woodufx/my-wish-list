import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from './db/client';
import { guests, reservations, wishes, wishlists } from './db/schema';
import { hashToken } from './lib/token';
// Type-only imports from the pure Zod contract modules (no React at runtime).
import type { ReservationStatus, Wish, WishDraft, WishPublic } from '../entities/wish/model/schema';
import type { Wishlist } from '../entities/wishlist/model/schema';
import type { MyReservation } from '../entities/reservation/model/schema';

type WishRow = typeof wishes.$inferSelect;
type WishlistRow = typeof wishlists.$inferSelect;

/** DB row → the API `Wish` contract (numeric price → number, drop server-only cols). */
function toWish(row: WishRow): Wish {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    price: Number(row.price),
    currency: row.currency,
    imageUrl: row.imageUrl,
    priority: row.priority,
    note: row.note,
  };
}

function toWishlist(row: WishlistRow): Wishlist {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    note: row.note,
    ownerName: row.ownerName,
    occasion: row.occasion,
    occasionDate: row.occasionDate,
  };
}

function statusFor(
  reservedGuestId: string | undefined,
  myGuestId: string | null,
): ReservationStatus {
  if (!reservedGuestId) {
    return 'free';
  }
  return myGuestId !== null && reservedGuestId === myGuestId ? 'taken_by_me' : 'taken_by_other';
}

async function getWishlistRow(slug: string): Promise<WishlistRow | undefined> {
  const [row] = await db.select().from(wishlists).where(eq(wishlists.slug, slug)).limit(1);
  return row;
}

/** The guest's id for an existing token — never creates one (read paths only). */
async function findGuestId(rawToken: string | null): Promise<string | null> {
  if (!rawToken) {
    return null;
  }
  const [row] = await db
    .select({ id: guests.id })
    .from(guests)
    .where(eq(guests.tokenHash, hashToken(rawToken)))
    .limit(1);
  return row?.id ?? null;
}

/** Find-or-create the guest row for a token (used by the reserve path). */
async function ensureGuestId(rawToken: string): Promise<string> {
  const tokenHash = hashToken(rawToken);
  const existing = await db
    .select({ id: guests.id })
    .from(guests)
    .where(eq(guests.tokenHash, tokenHash))
    .limit(1);
  if (existing[0]) {
    return existing[0].id;
  }
  const inserted = await db
    .insert(guests)
    .values({ tokenHash })
    .onConflictDoNothing({ target: guests.tokenHash })
    .returning({ id: guests.id });
  if (inserted[0]) {
    return inserted[0].id;
  }
  // Lost a race to create the same guest — read the row the winner inserted.
  const [row] = await db
    .select({ id: guests.id })
    .from(guests)
    .where(eq(guests.tokenHash, tokenHash))
    .limit(1);
  return row.id;
}

export async function getWishlist(slug: string): Promise<Wishlist | null> {
  const row = await getWishlistRow(slug);
  return row ? toWishlist(row) : null;
}

/** Guest view: wishes for a list, each tagged with this guest's reservation status. */
export async function listPublicWishes(
  slug: string,
  rawToken: string | null,
): Promise<WishPublic[] | null> {
  const wl = await getWishlistRow(slug);
  if (!wl) {
    return null;
  }
  const rows = await db
    .select()
    .from(wishes)
    .where(eq(wishes.wishlistId, wl.id))
    .orderBy(asc(wishes.position));
  if (rows.length === 0) {
    return [];
  }
  const resRows = await db
    .select({ wishId: reservations.wishId, guestId: reservations.guestId })
    .from(reservations)
    .where(
      inArray(
        reservations.wishId,
        rows.map((r) => r.id),
      ),
    );
  const reservedBy = new Map(resRows.map((r) => [r.wishId, r.guestId]));
  const myGuestId = await findGuestId(rawToken);
  return rows.map((row) => ({
    ...toWish(row),
    reservationStatus: statusFor(reservedBy.get(row.id), myGuestId),
  }));
}

export async function getPublicWish(
  id: string,
  rawToken: string | null,
): Promise<WishPublic | null> {
  const [row] = await db.select().from(wishes).where(eq(wishes.id, id)).limit(1);
  if (!row) {
    return null;
  }
  const [res] = await db
    .select({ guestId: reservations.guestId })
    .from(reservations)
    .where(eq(reservations.wishId, id))
    .limit(1);
  const myGuestId = await findGuestId(rawToken);
  return { ...toWish(row), reservationStatus: statusFor(res?.guestId, myGuestId) };
}

export interface ReserveResult {
  ok: boolean;
  notFound?: boolean;
  createdAt?: string;
}

/**
 * Reserve a wish for a guest. The `reservations_wish_id_unique` index is THE race
 * guard: the insert is atomic, so two guests racing produce exactly one winner and
 * the loser falls through to the conflict branch (idempotent for the same guest).
 */
export async function reserve(wishId: string, rawToken: string): Promise<ReserveResult> {
  const [wish] = await db
    .select({ id: wishes.id })
    .from(wishes)
    .where(eq(wishes.id, wishId))
    .limit(1);
  if (!wish) {
    return { ok: false, notFound: true };
  }
  const guestId = await ensureGuestId(rawToken);
  const inserted = await db
    .insert(reservations)
    .values({ wishId, guestId })
    .onConflictDoNothing({ target: reservations.wishId })
    .returning({ createdAt: reservations.createdAt });
  if (inserted[0]) {
    return { ok: true, createdAt: inserted[0].createdAt.toISOString() };
  }
  // Already reserved — succeed idempotently if it's this guest's, else conflict.
  const [existing] = await db
    .select({ guestId: reservations.guestId, createdAt: reservations.createdAt })
    .from(reservations)
    .where(eq(reservations.wishId, wishId))
    .limit(1);
  if (existing && existing.guestId === guestId) {
    return { ok: true, createdAt: existing.createdAt.toISOString() };
  }
  return { ok: false };
}

export async function cancel(wishId: string, rawToken: string): Promise<void> {
  const guestId = await findGuestId(rawToken);
  if (!guestId) {
    return;
  }
  await db
    .delete(reservations)
    .where(and(eq(reservations.wishId, wishId), eq(reservations.guestId, guestId)));
}

export async function myReservations(rawToken: string | null): Promise<MyReservation[]> {
  const guestId = await findGuestId(rawToken);
  if (!guestId) {
    return [];
  }
  const rows = await db
    .select({ wish: wishes, createdAt: reservations.createdAt })
    .from(reservations)
    .innerJoin(wishes, eq(wishes.id, reservations.wishId))
    .where(eq(reservations.guestId, guestId))
    .orderBy(asc(reservations.createdAt));
  return rows.map((row) => ({
    wish: { ...toWish(row.wish), reservationStatus: 'taken_by_me' as const },
    createdAt: row.createdAt.toISOString(),
  }));
}

// ---- Owner (admin): plain wishes only, NEVER reservation data ----

export async function listAdminWishes(slug: string): Promise<Wish[] | null> {
  const wl = await getWishlistRow(slug);
  if (!wl) {
    return null;
  }
  const rows = await db
    .select()
    .from(wishes)
    .where(eq(wishes.wishlistId, wl.id))
    .orderBy(asc(wishes.position));
  return rows.map(toWish);
}

export async function createWish(slug: string, draft: WishDraft): Promise<Wish | null> {
  const wl = await getWishlistRow(slug);
  if (!wl) {
    return null;
  }
  // New wishes go to the top of the list (position 0), like the mock.
  const [inserted] = await db
    .insert(wishes)
    .values({
      wishlistId: wl.id,
      title: draft.title,
      url: draft.url,
      price: draft.price.toString(),
      currency: draft.currency,
      imageUrl: draft.imageUrl,
      priority: draft.priority,
      note: draft.note,
      position: -1,
    })
    .returning();
  return toWish(inserted);
}

export async function updateWish(id: string, draft: WishDraft): Promise<Wish | null> {
  const [updated] = await db
    .update(wishes)
    .set({
      title: draft.title,
      url: draft.url,
      price: draft.price.toString(),
      currency: draft.currency,
      imageUrl: draft.imageUrl,
      priority: draft.priority,
      note: draft.note,
    })
    .where(eq(wishes.id, id))
    .returning();
  return updated ? toWish(updated) : null;
}

export async function deleteWish(id: string): Promise<void> {
  await db.delete(wishes).where(eq(wishes.id, id));
}
