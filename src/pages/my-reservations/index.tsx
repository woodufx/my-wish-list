import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/my-reservations/')({
  component: MyReservationsPage,
});

function MyReservationsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Мои брони</h1>
    </main>
  );
}
