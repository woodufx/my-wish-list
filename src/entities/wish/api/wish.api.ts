import { z } from 'zod';
import { http } from '@/shared/api';
import {
  WishAdminSchema,
  WishPublicSchema,
  type WishAdmin,
  type WishDraft,
  type WishPublic,
} from '../model/schema';

const WishPublicListSchema = z.array(WishPublicSchema);
const WishAdminListSchema = z.array(WishAdminSchema);

export function fetchPublicWishes(slug: string, signal?: AbortSignal): Promise<WishPublic[]> {
  return http.get(`/wishlists/${slug}/wishes`, WishPublicListSchema, signal);
}

export function fetchWish(id: string, signal?: AbortSignal): Promise<WishPublic> {
  return http.get(`/wishes/${id}`, WishPublicSchema, signal);
}

export function fetchAdminWishes(slug: string, signal?: AbortSignal): Promise<WishAdmin[]> {
  return http.get(`/admin/wishlists/${slug}/wishes`, WishAdminListSchema, signal);
}

export function createWish(slug: string, draft: WishDraft): Promise<WishAdmin> {
  return http.post(`/admin/wishlists/${slug}/wishes`, draft, WishAdminSchema);
}

export function updateWish(id: string, draft: WishDraft): Promise<WishAdmin> {
  return http.patch(`/admin/wishes/${id}`, draft, WishAdminSchema);
}

export function deleteWish(id: string): Promise<void> {
  return http.del(`/admin/wishes/${id}`, z.void());
}
