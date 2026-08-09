import { useQuery } from '@tanstack/react-query';
import { reservationKeys } from './keys';
import { fetchMyReservations } from './reservation.api';

export function useMyReservations() {
  return useQuery({
    queryKey: reservationKeys.mine(),
    queryFn: ({ signal }) => fetchMyReservations(signal),
  });
}
