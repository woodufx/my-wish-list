import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

// Temporary landing that just links to the screens while routing is scaffolded.
// Real composition (features/entities) arrives in stage 3.
function IndexPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Вишлист</h1>
      <nav className="flex flex-col gap-2 text-ink-200">
        <Link to="/wishlist/$slug" params={{ slug: 'demo' }} className="underline">
          Публичный вишлист (demo)
        </Link>
        <Link to="/admin/$slug" params={{ slug: 'demo' }} className="underline">
          Админка (demo)
        </Link>
        <Link to="/my-reservations" className="underline">
          Мои брони
        </Link>
      </nav>
    </main>
  );
}
