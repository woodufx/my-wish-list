import { createFileRoute } from '@tanstack/react-router';
import { PublicWishlist } from './-components/PublicWishlist';

export const Route = createFileRoute('/wishlist/$slug')({
  component: WishlistPage,
});

function WishlistPage() {
  const { slug } = Route.useParams();
  return <PublicWishlist slug={slug} />;
}
