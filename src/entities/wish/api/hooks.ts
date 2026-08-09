import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishKeys } from './keys';
import {
  createWish,
  deleteWish,
  fetchAdminWishes,
  fetchPublicWishes,
  fetchWish,
  updateWish,
} from './wish.api';
import type { WishDraft } from '../model/schema';

export function usePublicWishes(slug: string) {
  return useQuery({
    queryKey: wishKeys.publicList(slug),
    queryFn: ({ signal }) => fetchPublicWishes(slug, signal),
  });
}

export function useWish(id: string) {
  return useQuery({
    queryKey: wishKeys.detail(id),
    queryFn: ({ signal }) => fetchWish(id, signal),
  });
}

export function useAdminWishes(slug: string) {
  return useQuery({
    queryKey: wishKeys.adminList(slug),
    queryFn: ({ signal }) => fetchAdminWishes(slug, signal),
  });
}

/** One mutation for both create and edit — presence of `id` decides which. */
export function useSaveWish(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; draft: WishDraft }) =>
      input.id === undefined ? createWish(slug, input.draft) : updateWish(input.id, input.draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishKeys.adminList(slug) });
    },
  });
}

export function useDeleteWish(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWish(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishKeys.adminList(slug) });
    },
  });
}
