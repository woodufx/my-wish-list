import { z } from 'zod';

/** How badly the owner wants the item. */
export const WishPrioritySchema = z.enum(['dream', 'want_badly', 'would_be_nice']);
export type WishPriority = z.infer<typeof WishPrioritySchema>;

export const CurrencySchema = z.enum(['RUB', 'USD', 'EUR']);
export type Currency = z.infer<typeof CurrencySchema>;

/** Reservation status as seen by a guest — never exposed to the owner. */
export const ReservationStatusSchema = z.enum(['free', 'taken_by_other', 'taken_by_me']);
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

/**
 * Base wish shape. Deliberately contains NO reservation information: this is the
 * exact type the owner (admin) sees, so booking data cannot leak into the UI.
 */
export const WishSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  url: z.url().nullable(),
  price: z.number().nonnegative(),
  currency: CurrencySchema,
  imageUrl: z.url().nullable(),
  priority: WishPrioritySchema,
  note: z.string().nullable(),
});
export type Wish = z.infer<typeof WishSchema>;

/**
 * What the owner's admin endpoint returns: a plain wish with the reservation
 * fields PHYSICALLY ABSENT (not optional, not null). Rendering booking info is
 * therefore impossible by construction.
 */
export const WishAdminSchema = WishSchema;
export type WishAdmin = z.infer<typeof WishAdminSchema>;

/** What a guest sees: the wish plus its reservation status. */
export const WishPublicSchema = WishSchema.extend({
  reservationStatus: ReservationStatusSchema,
});
export type WishPublic = z.infer<typeof WishPublicSchema>;

/** Writable fields of a wish — the payload for create/edit (id is server-assigned). */
export const WishDraftSchema = WishSchema.omit({ id: true });
export type WishDraft = z.infer<typeof WishDraftSchema>;
