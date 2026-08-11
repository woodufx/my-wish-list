import { createFileRoute } from '@tanstack/react-router';
import { OwnerGate } from '@/features/owner-auth';
import { AdminScreen } from './-components/AdminScreen';

export const Route = createFileRoute('/admin/$slug')({
  component: AdminPage,
});

function AdminPage() {
  const { slug } = Route.useParams();
  return (
    <OwnerGate>
      <AdminScreen slug={slug} />
    </OwnerGate>
  );
}
