import { describe, expect, it } from 'vitest';
import { WishAdminSchema, WishDraftSchema, WishPublicSchema, WishSchema } from './schema';

const validWish = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Наушники',
  url: null,
  price: 34990,
  currency: 'RUB',
  imageUrl: null,
  priority: 'dream',
  note: null,
};

describe('WishSchema', () => {
  it('parses a valid wish', () => {
    expect(WishSchema.parse(validWish)).toEqual(validWish);
  });

  it('rejects a negative price', () => {
    expect(WishSchema.safeParse({ ...validWish, price: -1 }).success).toBe(false);
  });

  it('rejects an unknown priority', () => {
    expect(WishSchema.safeParse({ ...validWish, priority: 'meh' }).success).toBe(false);
  });
});

describe('WishAdminSchema (privacy)', () => {
  it('has no reservation fields in its output type or parsed value', () => {
    // Even if the server leaks reservation data, the admin schema strips it, so
    // it can never reach the owner's UI.
    const parsed = WishAdminSchema.parse({ ...validWish, reservationStatus: 'taken_by_other' });
    expect(parsed).not.toHaveProperty('reservationStatus');
    expect(Object.keys(parsed)).toEqual(Object.keys(validWish));
  });
});

describe('WishPublicSchema', () => {
  it('requires a reservation status', () => {
    expect(WishPublicSchema.safeParse(validWish).success).toBe(false);
    expect(WishPublicSchema.safeParse({ ...validWish, reservationStatus: 'free' }).success).toBe(
      true,
    );
  });
});

describe('WishDraftSchema', () => {
  it('omits the id', () => {
    const { id: _id, ...draft } = validWish;
    expect(WishDraftSchema.parse(draft)).not.toHaveProperty('id');
    expect(WishDraftSchema.safeParse(validWish).success).toBe(true);
  });
});
