var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/vercel-entry.ts
import { getRequestListener } from "@hono/node-server";

// src/server/index.ts
import { Hono as Hono4 } from "hono";

// src/server/env.ts
import { z } from "zod";
var serverEnvSchema = z.object({
  /** Neon Postgres connection string (HTTP driver). */
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  /** Long random secret that grants owner (admin) access. */
  OWNER_SECRET: z.string().min(16, "OWNER_SECRET must be at least 16 characters"),
  /** Secret used to sign the owner cookie. */
  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be at least 16 characters")
});
var parsed = serverEnvSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid server environment variables:
${z.prettifyError(parsed.error)}`);
}
var env = parsed.data;

// src/server/middleware/error.ts
var HttpError = class extends Error {
  status;
  code;
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
};
var errors = {
  notFound: (message = "Not found") => new HttpError(404, "NOT_FOUND", message),
  noToken: (message = "Missing guest token") => new HttpError(400, "NO_TOKEN", message),
  unauthorized: (message = "Unauthorized") => new HttpError(401, "UNAUTHORIZED", message),
  forbidden: (message = "Forbidden") => new HttpError(403, "FORBIDDEN", message),
  alreadyReserved: (message = "Already reserved by someone else") => new HttpError(409, "ALREADY_RESERVED", message),
  validation: (message = "Invalid request") => new HttpError(400, "VALIDATION", message)
};
function onError(err, c) {
  if (err instanceof HttpError) {
    return c.json({ code: err.code, message: err.message }, err.status);
  }
  console.error("Unhandled server error:", err);
  return c.json({ code: "INTERNAL", message: "Server error" }, 500);
}
function notFound(c) {
  return c.json({ code: "NOT_FOUND", message: "Not found" }, 404);
}

// src/server/routes/guest.ts
import { Hono } from "hono";

// src/server/queries.ts
import { and, asc, eq, inArray } from "drizzle-orm";

// src/server/db/client.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// src/server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  currencyEnum: () => currencyEnum,
  guests: () => guests,
  reservations: () => reservations,
  wishPriorityEnum: () => wishPriorityEnum,
  wishes: () => wishes,
  wishlists: () => wishlists
});
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

// src/entities/wish/model/schema.ts
import { z as z2 } from "zod";
var WishPrioritySchema = z2.enum(["dream", "want_badly", "would_be_nice"]);
var CurrencySchema = z2.enum(["RUB", "USD", "EUR"]);
var ReservationStatusSchema = z2.enum(["free", "taken_by_other", "taken_by_me"]);
var WishSchema = z2.object({
  id: z2.uuid(),
  title: z2.string().min(1),
  url: z2.url().nullable(),
  price: z2.number().nonnegative(),
  currency: CurrencySchema,
  imageUrl: z2.url().nullable(),
  priority: WishPrioritySchema,
  note: z2.string().nullable()
});
var WishPublicSchema = WishSchema.extend({
  reservationStatus: ReservationStatusSchema
});
var WishDraftSchema = WishSchema.omit({ id: true });

// src/server/db/schema.ts
var currencyEnum = pgEnum("currency", CurrencySchema.options);
var wishPriorityEnum = pgEnum(
  "wish_priority",
  WishPrioritySchema.options
);
var wishlists = pgTable("wishlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  note: text("note"),
  ownerName: text("owner_name").notNull(),
  occasion: text("occasion"),
  // Stored as a bare calendar date (no time), matching `z.iso.date()`.
  occasionDate: date("occasion_date")
});
var wishes = pgTable("wishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  wishlistId: uuid("wishlist_id").notNull().references(() => wishlists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  // `numeric` keeps cents for USD/EUR; the routes convert it to a JS number to
  // satisfy `WishSchema.price` (`z.number()`).
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  imageUrl: text("image_url"),
  priority: wishPriorityEnum("priority").notNull(),
  note: text("note"),
  // Owner-controlled ordering; not part of the API contract, drives sort order.
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Only the sha256 hash of the guest token is ever stored — the raw token lives
  // solely in the guest's localStorage and arrives in the X-Guest-Token header.
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wishId: uuid("wish_id").notNull().references(() => wishes.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").notNull().references(() => guests.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    // THE race guard: one reservation per wish, enforced by the database. Two
    // guests racing to book the same wish resolve to exactly one insert; the
    // loser hits this constraint and the route turns it into a 409.
    uniqueIndex("reservations_wish_id_unique").on(table.wishId)
  ]
);

// src/server/db/client.ts
var sql = neon(env.DATABASE_URL);
var db = drizzle(sql, { schema: schema_exports });

// src/server/lib/token.ts
import { createHash } from "node:crypto";
function hashToken(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

// src/server/queries.ts
function toWish(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    price: Number(row.price),
    currency: row.currency,
    imageUrl: row.imageUrl,
    priority: row.priority,
    note: row.note
  };
}
function toWishlist(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    note: row.note,
    ownerName: row.ownerName,
    occasion: row.occasion,
    occasionDate: row.occasionDate
  };
}
function statusFor(reservedGuestId, myGuestId) {
  if (!reservedGuestId) {
    return "free";
  }
  return myGuestId !== null && reservedGuestId === myGuestId ? "taken_by_me" : "taken_by_other";
}
async function getWishlistRow(slug) {
  const [row] = await db.select().from(wishlists).where(eq(wishlists.slug, slug)).limit(1);
  return row;
}
async function findGuestId(rawToken) {
  if (!rawToken) {
    return null;
  }
  const [row] = await db.select({ id: guests.id }).from(guests).where(eq(guests.tokenHash, hashToken(rawToken))).limit(1);
  return row?.id ?? null;
}
async function ensureGuestId(rawToken) {
  const tokenHash = hashToken(rawToken);
  const existing = await db.select({ id: guests.id }).from(guests).where(eq(guests.tokenHash, tokenHash)).limit(1);
  if (existing[0]) {
    return existing[0].id;
  }
  const inserted = await db.insert(guests).values({ tokenHash }).onConflictDoNothing({ target: guests.tokenHash }).returning({ id: guests.id });
  if (inserted[0]) {
    return inserted[0].id;
  }
  const [row] = await db.select({ id: guests.id }).from(guests).where(eq(guests.tokenHash, tokenHash)).limit(1);
  return row.id;
}
async function getWishlist(slug) {
  const row = await getWishlistRow(slug);
  return row ? toWishlist(row) : null;
}
async function listPublicWishes(slug, rawToken) {
  const wl = await getWishlistRow(slug);
  if (!wl) {
    return null;
  }
  const rows = await db.select().from(wishes).where(eq(wishes.wishlistId, wl.id)).orderBy(asc(wishes.position));
  if (rows.length === 0) {
    return [];
  }
  const resRows = await db.select({ wishId: reservations.wishId, guestId: reservations.guestId }).from(reservations).where(
    inArray(
      reservations.wishId,
      rows.map((r) => r.id)
    )
  );
  const reservedBy = new Map(resRows.map((r) => [r.wishId, r.guestId]));
  const myGuestId = await findGuestId(rawToken);
  return rows.map((row) => ({
    ...toWish(row),
    reservationStatus: statusFor(reservedBy.get(row.id), myGuestId)
  }));
}
async function getPublicWish(id, rawToken) {
  const [row] = await db.select().from(wishes).where(eq(wishes.id, id)).limit(1);
  if (!row) {
    return null;
  }
  const [res] = await db.select({ guestId: reservations.guestId }).from(reservations).where(eq(reservations.wishId, id)).limit(1);
  const myGuestId = await findGuestId(rawToken);
  return { ...toWish(row), reservationStatus: statusFor(res?.guestId, myGuestId) };
}
async function reserve(wishId, rawToken) {
  const [wish] = await db.select({ id: wishes.id }).from(wishes).where(eq(wishes.id, wishId)).limit(1);
  if (!wish) {
    return { ok: false, notFound: true };
  }
  const guestId = await ensureGuestId(rawToken);
  const inserted = await db.insert(reservations).values({ wishId, guestId }).onConflictDoNothing({ target: reservations.wishId }).returning({ createdAt: reservations.createdAt });
  if (inserted[0]) {
    return { ok: true, createdAt: inserted[0].createdAt.toISOString() };
  }
  const [existing] = await db.select({ guestId: reservations.guestId, createdAt: reservations.createdAt }).from(reservations).where(eq(reservations.wishId, wishId)).limit(1);
  if (existing && existing.guestId === guestId) {
    return { ok: true, createdAt: existing.createdAt.toISOString() };
  }
  return { ok: false };
}
async function cancel(wishId, rawToken) {
  const guestId = await findGuestId(rawToken);
  if (!guestId) {
    return;
  }
  await db.delete(reservations).where(and(eq(reservations.wishId, wishId), eq(reservations.guestId, guestId)));
}
async function myReservations(rawToken) {
  const guestId = await findGuestId(rawToken);
  if (!guestId) {
    return [];
  }
  const rows = await db.select({ wish: wishes, createdAt: reservations.createdAt }).from(reservations).innerJoin(wishes, eq(wishes.id, reservations.wishId)).where(eq(reservations.guestId, guestId)).orderBy(asc(reservations.createdAt));
  return rows.map((row) => ({
    wish: { ...toWish(row.wish), reservationStatus: "taken_by_me" },
    createdAt: row.createdAt.toISOString()
  }));
}
async function listAdminWishes(slug) {
  const wl = await getWishlistRow(slug);
  if (!wl) {
    return null;
  }
  const rows = await db.select().from(wishes).where(eq(wishes.wishlistId, wl.id)).orderBy(asc(wishes.position));
  return rows.map(toWish);
}
async function createWish(slug, draft) {
  const wl = await getWishlistRow(slug);
  if (!wl) {
    return null;
  }
  const [inserted] = await db.insert(wishes).values({
    wishlistId: wl.id,
    title: draft.title,
    url: draft.url,
    price: draft.price.toString(),
    currency: draft.currency,
    imageUrl: draft.imageUrl,
    priority: draft.priority,
    note: draft.note,
    position: -1
  }).returning();
  return toWish(inserted);
}
async function updateWish(id, draft) {
  const [updated] = await db.update(wishes).set({
    title: draft.title,
    url: draft.url,
    price: draft.price.toString(),
    currency: draft.currency,
    imageUrl: draft.imageUrl,
    priority: draft.priority,
    note: draft.note
  }).where(eq(wishes.id, id)).returning();
  return updated ? toWish(updated) : null;
}
async function deleteWish(id) {
  await db.delete(wishes).where(eq(wishes.id, id));
}

// src/server/routes/guest.ts
var guestRoutes = new Hono();
guestRoutes.get("/wishlists/:slug", async (c) => {
  const wishlist = await getWishlist(c.req.param("slug"));
  if (!wishlist) {
    throw errors.notFound("Wishlist not found");
  }
  return c.json(wishlist);
});
guestRoutes.get("/wishlists/:slug/wishes", async (c) => {
  const token = c.req.header("X-Guest-Token") ?? null;
  const wishes2 = await listPublicWishes(c.req.param("slug"), token);
  if (wishes2 === null) {
    throw errors.notFound("Wishlist not found");
  }
  return c.json(wishes2);
});
guestRoutes.get("/wishes/:id", async (c) => {
  const token = c.req.header("X-Guest-Token") ?? null;
  const wish = await getPublicWish(c.req.param("id"), token);
  if (!wish) {
    throw errors.notFound("Wish not found");
  }
  return c.json(wish);
});
guestRoutes.post("/wishes/:id/reservation", async (c) => {
  const token = c.req.header("X-Guest-Token");
  if (!token) {
    throw errors.noToken();
  }
  const id = c.req.param("id");
  const result = await reserve(id, token);
  if (result.notFound) {
    throw errors.notFound("Wish not found");
  }
  if (!result.ok) {
    throw errors.alreadyReserved();
  }
  return c.json({ wishId: id, createdAt: result.createdAt }, 201);
});
guestRoutes.delete("/wishes/:id/reservation", async (c) => {
  const token = c.req.header("X-Guest-Token");
  if (!token) {
    throw errors.noToken();
  }
  await cancel(c.req.param("id"), token);
  return c.body(null, 204);
});
guestRoutes.get("/me/reservations", async (c) => {
  const token = c.req.header("X-Guest-Token") ?? null;
  return c.json(await myReservations(token));
});

// src/server/routes/owner.ts
import { Hono as Hono2 } from "hono";

// src/server/lib/owner.ts
import { timingSafeEqual } from "node:crypto";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
var COOKIE = "owner";
var MAX_AGE = 60 * 60 * 24 * 30;
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for owner authentication`);
  }
  return value;
}
function verifyOwnerSecret(secret) {
  const expected = Buffer.from(requireEnv("OWNER_SECRET"));
  const given = Buffer.from(secret);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
async function isOwner(c) {
  const value = await getSignedCookie(c, requireEnv("COOKIE_SECRET"), COOKIE);
  return value === "1";
}
async function grantOwner(c) {
  await setSignedCookie(c, COOKIE, "1", requireEnv("COOKIE_SECRET"), {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE,
    // localhost dev is http; only mark Secure in production (https).
    secure: process.env.NODE_ENV === "production"
  });
}
function revokeOwner(c) {
  deleteCookie(c, COOKIE, { path: "/" });
}
var requireOwner = async (c, next) => {
  if (!await isOwner(c)) {
    throw errors.unauthorized("Owner access required");
  }
  await next();
};

// src/server/routes/owner.ts
var ownerRoutes = new Hono2();
ownerRoutes.get("/session", async (c) => c.json({ authenticated: await isOwner(c) }));
ownerRoutes.post("/session", async (c) => {
  const body = await c.req.json().catch(() => null);
  const secret = body && typeof body === "object" && "secret" in body && typeof body.secret === "string" ? body.secret : "";
  if (!verifyOwnerSecret(secret)) {
    throw errors.unauthorized("Invalid secret");
  }
  await grantOwner(c);
  return c.json({ authenticated: true });
});
ownerRoutes.delete("/session", (c) => {
  revokeOwner(c);
  return c.json({ authenticated: false });
});

// src/server/routes/admin.ts
import { Hono as Hono3 } from "hono";
var adminRoutes = new Hono3();
adminRoutes.use("*", requireOwner);
adminRoutes.get("/wishlists/:slug/wishes", async (c) => {
  const wishes2 = await listAdminWishes(c.req.param("slug"));
  if (wishes2 === null) {
    throw errors.notFound("Wishlist not found");
  }
  return c.json(wishes2);
});
adminRoutes.post("/wishlists/:slug/wishes", async (c) => {
  const parsed2 = WishDraftSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed2.success) {
    throw errors.validation("Invalid wish");
  }
  const created = await createWish(c.req.param("slug"), parsed2.data);
  if (!created) {
    throw errors.notFound("Wishlist not found");
  }
  return c.json(created, 201);
});
adminRoutes.patch("/wishes/:id", async (c) => {
  const parsed2 = WishDraftSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed2.success) {
    throw errors.validation("Invalid wish");
  }
  const updated = await updateWish(c.req.param("id"), parsed2.data);
  if (!updated) {
    throw errors.notFound("Wish not found");
  }
  return c.json(updated);
});
adminRoutes.delete("/wishes/:id", async (c) => {
  await deleteWish(c.req.param("id"));
  return c.body(null, 204);
});

// src/server/index.ts
var app = new Hono4().basePath("/api");
app.onError(onError);
app.notFound(notFound);
app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/", guestRoutes);
app.route("/owner", ownerRoutes);
app.route("/admin", adminRoutes);
var index_default = app;

// src/server/vercel-entry.ts
var vercel_entry_default = getRequestListener(index_default.fetch);
export {
  vercel_entry_default as default
};
