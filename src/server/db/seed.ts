import { db } from './client';
import { guests, reservations, wishes, wishlists } from './schema';
import { hashToken } from '../lib/token';
// The same fixtures MSW serves, so screens look familiar after the switch. The
// `@/entities` imports inside this module are type-only and erased at runtime,
// so no path-alias resolution is needed here.
import { initialReservations, wishesFixture, wishlistFixture } from '../../mocks/fixtures';

async function seed(): Promise<void> {
  // Idempotent: wipe in FK-safe order, then re-insert the fixtures.
  await db.delete(reservations);
  await db.delete(wishes);
  await db.delete(guests);
  await db.delete(wishlists);

  await db.insert(wishlists).values({
    id: wishlistFixture.id,
    slug: wishlistFixture.slug,
    title: wishlistFixture.title,
    note: wishlistFixture.note,
    ownerName: wishlistFixture.ownerName,
    occasion: wishlistFixture.occasion,
    occasionDate: wishlistFixture.occasionDate,
  });

  await db.insert(wishes).values(
    wishesFixture.map((wish, index) => ({
      id: wish.id,
      wishlistId: wishlistFixture.id,
      title: wish.title,
      url: wish.url,
      price: wish.price.toString(),
      currency: wish.currency,
      imageUrl: wish.imageUrl,
      priority: wish.priority,
      note: wish.note,
      position: index,
    })),
  );

  // One guest row per distinct raw token in the reservation fixtures, stored as a
  // sha256 digest. Keep a token → guestId map to wire up the reservations below.
  const rawTokens = [...new Set(Object.values(initialReservations).map((r) => r.token))];
  const guestRows = await db
    .insert(guests)
    .values(rawTokens.map((token) => ({ tokenHash: hashToken(token) })))
    .returning({ id: guests.id, tokenHash: guests.tokenHash });

  const guestIdByHash = new Map(guestRows.map((g) => [g.tokenHash, g.id]));

  await db.insert(reservations).values(
    Object.entries(initialReservations).map(([wishId, reservation]) => {
      const guestId = guestIdByHash.get(hashToken(reservation.token));
      if (!guestId) {
        throw new Error(`No guest seeded for reservation on wish ${wishId}`);
      }
      return { wishId, guestId, createdAt: new Date(reservation.createdAt) };
    }),
  );

  const counts = {
    wishlists: 1,
    wishes: wishesFixture.length,
    guests: guestRows.length,
    reservations: Object.keys(initialReservations).length,
  };
  console.log(`Seeded: ${JSON.stringify(counts)}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
