import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { wishKeys, type ReservationStatus, type WishPublic } from '@/entities/wish';
import {
  cancelReservation,
  reservationKeys,
  reserveWish,
  type MyReservation,
} from '@/entities/reservation';
import { useGuest } from '@/entities/guest';
import { isReservationConflict } from '@/shared/api';
import { toast } from '@/shared/lib/toast';

interface OptimisticContext {
  previousList: WishPublic[] | undefined;
  previousDetail: WishPublic | undefined;
  previousMine: MyReservation[] | undefined;
}

/** Flips a wish's status in both the list and detail caches at once. */
function setWishStatus(
  queryClient: QueryClient,
  slug: string,
  wishId: string,
  status: ReservationStatus,
): void {
  queryClient.setQueryData<WishPublic[]>(wishKeys.publicList(slug), (list) =>
    list?.map((wish) => (wish.id === wishId ? { ...wish, reservationStatus: status } : wish)),
  );
  queryClient.setQueryData<WishPublic>(wishKeys.detail(wishId), (wish) =>
    wish ? { ...wish, reservationStatus: status } : wish,
  );
}

function findWish(queryClient: QueryClient, slug: string, wishId: string): WishPublic | undefined {
  return (
    queryClient.getQueryData<WishPublic>(wishKeys.detail(wishId)) ??
    queryClient
      .getQueryData<WishPublic[]>(wishKeys.publicList(slug))
      ?.find((wish) => wish.id === wishId)
  );
}

/** Add the just-reserved wish to the "my bookings" cache so it's there the instant
 *  the guest opens that screen, instead of after a refetch. */
function addToMine(queryClient: QueryClient, slug: string, wishId: string): void {
  const wish = findWish(queryClient, slug, wishId);
  if (!wish) {
    return;
  }
  queryClient.setQueryData<MyReservation[]>(reservationKeys.mine(), (list) => {
    const base = list ?? [];
    if (base.some((entry) => entry.wish.id === wishId)) {
      return base;
    }
    return [
      { wish: { ...wish, reservationStatus: 'taken_by_me' }, createdAt: new Date().toISOString() },
      ...base,
    ];
  });
}

function removeFromMine(queryClient: QueryClient, wishId: string): void {
  queryClient.setQueryData<MyReservation[]>(reservationKeys.mine(), (list) =>
    list ? list.filter((entry) => entry.wish.id !== wishId) : list,
  );
}

function snapshot(queryClient: QueryClient, slug: string, wishId: string): OptimisticContext {
  return {
    previousList: queryClient.getQueryData<WishPublic[]>(wishKeys.publicList(slug)),
    previousDetail: queryClient.getQueryData<WishPublic>(wishKeys.detail(wishId)),
    previousMine: queryClient.getQueryData<MyReservation[]>(reservationKeys.mine()),
  };
}

function rollback(
  queryClient: QueryClient,
  slug: string,
  wishId: string,
  context: OptimisticContext | undefined,
): void {
  if (!context) {
    return;
  }
  queryClient.setQueryData(wishKeys.publicList(slug), context.previousList);
  queryClient.setQueryData(wishKeys.detail(wishId), context.previousDetail);
  queryClient.setQueryData(reservationKeys.mine(), context.previousMine);
}

function invalidate(queryClient: QueryClient, slug: string, wishId: string): void {
  void queryClient.invalidateQueries({ queryKey: wishKeys.publicList(slug) });
  void queryClient.invalidateQueries({ queryKey: wishKeys.detail(wishId) });
  void queryClient.invalidateQueries({ queryKey: reservationKeys.mine() });
}

/** Reserve a wish. Status flips instantly; rolls back and toasts on failure. */
export function useReserveWish(slug: string) {
  const queryClient = useQueryClient();
  const { ensureToken } = useGuest();

  return useMutation({
    mutationFn: (wishId: string) => {
      ensureToken(); // first reservation on this device materializes the guest token
      return reserveWish(wishId);
    },
    onMutate: async (wishId): Promise<OptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: wishKeys.publicList(slug) });
      await queryClient.cancelQueries({ queryKey: reservationKeys.mine() });
      const context = snapshot(queryClient, slug, wishId);
      setWishStatus(queryClient, slug, wishId, 'taken_by_me');
      addToMine(queryClient, slug, wishId);
      return context;
    },
    onError: (error, wishId, context) => {
      rollback(queryClient, slug, wishId, context);
      if (isReservationConflict(error)) {
        // Expected race: someone else booked it first — not a failure of ours.
        setWishStatus(queryClient, slug, wishId, 'taken_by_other');
        toast.error('Кто-то успел забронировать это раньше вас');
      } else {
        toast.error('Не удалось забронировать. Попробуйте ещё раз');
      }
    },
    onSettled: (_data, _error, wishId) => {
      invalidate(queryClient, slug, wishId);
    },
  });
}

/** Cancel the current guest's reservation. Status flips to free instantly. */
export function useCancelReservation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishId: string) => cancelReservation(wishId),
    onMutate: async (wishId): Promise<OptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: wishKeys.publicList(slug) });
      await queryClient.cancelQueries({ queryKey: reservationKeys.mine() });
      const context = snapshot(queryClient, slug, wishId);
      setWishStatus(queryClient, slug, wishId, 'free');
      removeFromMine(queryClient, wishId);
      return context;
    },
    onError: (_error, wishId, context) => {
      rollback(queryClient, slug, wishId, context);
      toast.error('Не удалось снять бронь. Попробуйте ещё раз');
    },
    onSettled: (_data, _error, wishId) => {
      invalidate(queryClient, slug, wishId);
    },
  });
}

/**
 * Cancels a reservation from the "my bookings" screen, where the wishlist slug is
 * unknown. Optimistically drops the row and refetches any affected wish list.
 */
export function useReleaseReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishId: string) => cancelReservation(wishId),
    onMutate: async (wishId): Promise<{ previous: MyReservation[] | undefined }> => {
      await queryClient.cancelQueries({ queryKey: reservationKeys.mine() });
      const previous = queryClient.getQueryData<MyReservation[]>(reservationKeys.mine());
      queryClient.setQueryData<MyReservation[]>(reservationKeys.mine(), (list) =>
        list?.filter((entry) => entry.wish.id !== wishId),
      );
      return { previous };
    },
    onError: (_error, _wishId, context) => {
      if (context) {
        queryClient.setQueryData(reservationKeys.mine(), context.previous);
      }
      toast.error('Не удалось снять бронь. Попробуйте ещё раз');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: reservationKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: wishKeys.all });
    },
  });
}
