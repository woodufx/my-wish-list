export const wishKeys = {
  all: ['wishes'] as const,
  publicList: (slug: string) => [...wishKeys.all, 'public', slug] as const,
  adminList: (slug: string) => [...wishKeys.all, 'admin', slug] as const,
  detail: (id: string) => [...wishKeys.all, 'detail', id] as const,
};
