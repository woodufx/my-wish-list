import { z } from 'zod';
import type { ReservationStatus, Wish, WishDraft } from '@/entities/wish';
import { initialReservations, wishesFixture, type StoredReservation } from './fixtures';

const ReservationMapSchema = z.record(
  z.string(),
  z.object({ token: z.string(), createdAt: z.string() }),
);

/**
 * Mutable mock state. Reservations are persisted to localStorage (when available)
 * so a booking survives a full page reload — the behaviour the e2e test asserts.
 * In Node (unit tests) there is no localStorage, so it stays in-process memory.
 */
const RESERVATIONS_KEY = 'mock.reservations';

type ReservationMap = Record<string, StoredReservation>;

function loadReservations(): ReservationMap {
  try {
    const raw = globalThis.localStorage?.getItem(RESERVATIONS_KEY);
    if (raw) {
      const parsed = ReservationMapSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        return parsed.data;
      }
    }
  } catch {
    // ignore — fall through to seed
  }
  return structuredClone(initialReservations);
}

function persist(): void {
  try {
    globalThis.localStorage?.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  } catch {
    // storage unavailable — in-process memory is enough
  }
}

let reservations: ReservationMap = loadReservations();
let wishes: Wish[] = wishesFixture.map((wish) => ({ ...wish }));

/** Resets all mock state to the fixtures — used between unit tests. */
export function resetDb(): void {
  reservations = structuredClone(initialReservations);
  wishes = wishesFixture.map((wish) => ({ ...wish }));
  persist();
}

export function listWishes(): Wish[] {
  return wishes;
}

export function findWish(id: string): Wish | undefined {
  return wishes.find((wish) => wish.id === id);
}

export function statusFor(wishId: string, token: string | null): ReservationStatus {
  const reservation = reservations[wishId];
  if (!reservation) {
    return 'free';
  }
  return reservation.token === token ? 'taken_by_me' : 'taken_by_other';
}

export interface ReserveResult {
  ok: boolean;
  createdAt?: string;
}

export function reserve(wishId: string, token: string): ReserveResult {
  const existing = reservations[wishId];
  if (existing && existing.token !== token) {
    return { ok: false };
  }
  const createdAt = existing?.createdAt ?? new Date().toISOString();
  reservations[wishId] = { token, createdAt };
  persist();
  return { ok: true, createdAt };
}

export function cancel(wishId: string, token: string): void {
  const existing = reservations[wishId];
  if (existing && existing.token === token) {
    delete reservations[wishId];
    persist();
  }
}

export function myReservations(token: string | null): Array<{ wish: Wish; createdAt: string }> {
  if (!token) {
    return [];
  }
  return Object.entries(reservations)
    .filter(([, reservation]) => reservation.token === token)
    .map(([wishId, reservation]) => ({ wish: findWish(wishId), createdAt: reservation.createdAt }))
    .filter((entry): entry is { wish: Wish; createdAt: string } => entry.wish !== undefined);
}

export function createWish(draft: WishDraft): Wish {
  const wish: Wish = { ...draft, id: crypto.randomUUID() };
  wishes = [wish, ...wishes];
  return wish;
}

export function updateWish(id: string, draft: WishDraft): Wish | undefined {
  let updated: Wish | undefined;
  wishes = wishes.map((wish) => {
    if (wish.id !== id) {
      return wish;
    }
    updated = { ...draft, id };
    return updated;
  });
  return updated;
}

export function deleteWish(id: string): void {
  wishes = wishes.filter((wish) => wish.id !== id);
  delete reservations[id];
  persist();
}
