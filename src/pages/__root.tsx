import { createRootRoute, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <div className="min-h-full">
      <Outlet />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-ink-400">Такой страницы нет.</p>
    </div>
  );
}
