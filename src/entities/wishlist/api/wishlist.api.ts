import { http } from '@/shared/api';
import { WishlistSchema, type Wishlist } from '../model/schema';

export function fetchWishlist(slug: string, signal?: AbortSignal): Promise<Wishlist> {
  return http.get(`/wishlists/${slug}`, WishlistSchema, signal);
}
