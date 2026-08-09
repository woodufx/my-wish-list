import { createFileRoute } from '@tanstack/react-router';
import { AdminScreen } from './-components/AdminScreen';

export const Route = createFileRoute('/admin/$slug')({
  component: AdminPage,
});

function AdminPage() {
  const { slug } = Route.useParams();
  return <AdminScreen slug={slug} />;
}
