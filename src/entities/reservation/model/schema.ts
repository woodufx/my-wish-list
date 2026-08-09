import { z } from 'zod';
import { WishPublicSchema } from '@/entities/wish/model/schema';

/** A booking made by the current guest. Owners never receive this. */
export const ReservationSchema = z.object({
  wishId: z.uuid(),
  createdAt: z.iso.datetime(),
});
export type Reservation = z.infer<typeof ReservationSchema>;

/** A guest's booking joined with the wish it points at, for the "my bookings" screen. */
export const MyReservationSchema = z.object({
  wish: WishPublicSchema,
  createdAt: z.iso.datetime(),
});
export type MyReservation = z.infer<typeof MyReservationSchema>;
