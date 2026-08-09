import { useQuery } from '@tanstack/react-query';
import { wishlistKeys } from './keys';
import { fetchWishlist } from './wishlist.api';

export function useWishlist(slug: string) {
  return useQuery({
    queryKey: wishlistKeys.detail(slug),
    queryFn: ({ signal }) => fetchWishlist(slug, signal),
  });
}
