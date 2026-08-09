export const wishlistKeys = {
  all: ['wishlists'] as const,
  detail: (slug: string) => [...wishlistKeys.all, 'detail', slug] as const,
};
