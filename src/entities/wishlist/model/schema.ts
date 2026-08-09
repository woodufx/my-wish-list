import { z } from 'zod';

export const WishlistSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  note: z.string().nullable(),
  ownerName: z.string().min(1),
  occasion: z.string().nullable(),
  occasionDate: z.iso.date().nullable(),
});
export type Wishlist = z.infer<typeof WishlistSchema>;
