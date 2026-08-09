import { beforeEach, describe, expect, it } from 'vitest';
import * as db from './db';

const WISH_FREE = '00000000-0000-4000-8000-000000000001';
const WISH_TAKEN_BY_OTHER = '00000000-0000-4000-8000-000000000002';

const GUEST_A = 'guest-a';
const GUEST_B = 'guest-b';

describe('mock db reservations', () => {
  beforeEach(() => {
    db.resetDb();
  });

  it('computes status relative to the requesting guest', () => {
    expect(db.statusFor(WISH_FREE, GUEST_A)).toBe('free');
    expect(db.statusFor(WISH_TAKEN_BY_OTHER, GUEST_A)).toBe('taken_by_other');
  });

  it('reserves a free wish and reflects it per guest', () => {
    const result = db.reserve(WISH_FREE, GUEST_A);
    expect(result.ok).toBe(true);
    expect(db.statusFor(WISH_FREE, GUEST_A)).toBe('taken_by_me');
    expect(db.statusFor(WISH_FREE, GUEST_B)).toBe('taken_by_other');
  });

  it('refuses to reserve a wish already taken by someone else', () => {
    expect(db.reserve(WISH_TAKEN_BY_OTHER, GUEST_A).ok).toBe(false);
  });

  it('cancels only the requesting guest’s reservation', () => {
    db.reserve(WISH_FREE, GUEST_A);
    db.cancel(WISH_FREE, GUEST_B); // wrong guest — no effect
    expect(db.statusFor(WISH_FREE, GUEST_A)).toBe('taken_by_me');
    db.cancel(WISH_FREE, GUEST_A);
    expect(db.statusFor(WISH_FREE, GUEST_A)).toBe('free');
  });

  it('lists the current guest’s reservations joined with wishes', () => {
    db.reserve(WISH_FREE, GUEST_A);
    const mine = db.myReservations(GUEST_A);
    expect(mine.map((entry) => entry.wish.id)).toContain(WISH_FREE);
  });
});
