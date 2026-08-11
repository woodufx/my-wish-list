import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
// Imported straight from the contract module (not the `@/entities/wish` barrel,
// which pulls in React) via a relative path, so drizzle-kit can bundle this file
// without tsconfig path resolution.
import {
  CurrencySchema,
  WishPrioritySchema,
  type Currency,
  type WishPriority,
} from '../../entities/wish/model/schema';

// Enum values are owned by the shared Zod contracts — reuse them so the database
// and the API can never drift apart. `.options` is a (non-empty) array of literals;
// asserting the non-empty-tuple shape lets `pgEnum` keep the exact string union.
export const currencyEnum = pgEnum('currency', CurrencySchema.options as [Currency, ...Currency[]]);
export const wishPriorityEnum = pgEnum(
  'wish_priority',
  WishPrioritySchema.options as [WishPriority, ...WishPriority[]],
);

export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  note: text('note'),
  ownerName: text('owner_name').notNull(),
  occasion: text('occasion'),
  // Stored as a bare calendar date (no time), matching `z.iso.date()`.
  occasionDate: date('occasion_date'),
});

export const wishes = pgTable('wishes', {
  id: uuid('id').primaryKey().defaultRandom(),
  wishlistId: uuid('wishlist_id')
    .notNull()
    .references(() => wishlists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url'),
  // `numeric` keeps cents for USD/EUR; the routes convert it to a JS number to
  // satisfy `WishSchema.price` (`z.number()`).
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum('currency').notNull(),
  imageUrl: text('image_url'),
  priority: wishPriorityEnum('priority').notNull(),
  note: text('note'),
  // Owner-controlled ordering; not part of the API contract, drives sort order.
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const guests = pgTable('guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Only the sha256 hash of the guest token is ever stored — the raw token lives
  // solely in the guest's localStorage and arrives in the X-Guest-Token header.
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wishId: uuid('wish_id')
      .notNull()
      .references(() => wishes.id, { onDelete: 'cascade' }),
    guestId: uuid('guest_id')
      .notNull()
      .references(() => guests.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // THE race guard: one reservation per wish, enforced by the database. Two
    // guests racing to book the same wish resolve to exactly one insert; the
    // loser hits this constraint and the route turns it into a 409.
    uniqueIndex('reservations_wish_id_unique').on(table.wishId),
  ],
);
