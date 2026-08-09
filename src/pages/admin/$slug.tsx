import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/$slug')({
  component: AdminPage,
});

function AdminPage() {
  const { slug } = Route.useParams();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Админка</h1>
      <p className="text-ink-400">slug: {slug}</p>
    </main>
  );
}
