import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useOwnerSession } from '@/features/owner-auth';
import { DEFAULT_WISHLIST_SLUG } from '@/shared/config/app';
import { LoadingScreen } from '@/shared/ui';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

/**
 * The root entry point. An owner (holds a valid session cookie) lands in their
 * admin console; everyone else goes straight to the public wishlist.
 */
function IndexPage() {
  const session = useOwnerSession();

  if (session.isPending) {
    return <LoadingScreen progress={0.85} done={false} />;
  }

  return session.data?.authenticated ? (
    <Navigate to="/admin/$slug" params={{ slug: DEFAULT_WISHLIST_SLUG }} replace />
  ) : (
    <Navigate to="/wishlist/$slug" params={{ slug: DEFAULT_WISHLIST_SLUG }} replace />
  );
}
