import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/wishlist/$slug')({
  component: WishlistPage,
});

function WishlistPage() {
  const { slug } = Route.useParams();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Публичный вишлист</h1>
      <p className="text-ink-400">slug: {slug}</p>
    </main>
  );
}
