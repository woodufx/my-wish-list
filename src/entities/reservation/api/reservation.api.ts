import { z } from 'zod';
import { http } from '@/shared/api';
import {
  MyReservationSchema,
  ReservationSchema,
  type MyReservation,
  type Reservation,
} from '../model/schema';

const MyReservationListSchema = z.array(MyReservationSchema);

export function fetchMyReservations(signal?: AbortSignal): Promise<MyReservation[]> {
  return http.get('/me/reservations', MyReservationListSchema, signal);
}

export function reserveWish(wishId: string): Promise<Reservation> {
  return http.post(`/wishes/${wishId}/reservation`, undefined, ReservationSchema);
}

export function cancelReservation(wishId: string): Promise<void> {
  return http.del(`/wishes/${wishId}/reservation`, z.void());
}
