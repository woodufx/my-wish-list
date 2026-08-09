import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import { env } from '@/shared/config/env';
import { setGuestTokenProvider } from '@/shared/api';
import { getGuestToken } from '@/entities/guest';
import '@/app/styles/global.css';

// The shared http client reads the guest token via injection (it must not import
// the guest entity directly, per the layer rule).
setGuestTokenProvider(getGuestToken);

// MSW is loaded lazily and only when enabled (dev / e2e) — never in production.
// The `import.meta.env.DEV` guard is a compile-time constant, so the dynamic
// import below is dead-code-eliminated from production builds entirely.
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || !env.VITE_ENABLE_MOCKS) {
    return;
  }
  const { worker, seedDemoGuest } = await import('@/mocks/browser');
  seedDemoGuest();
  await worker.start({ onUnhandledRequest: 'bypass' });
}

function render(): void {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root was not found in the document.');
  }
  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
}

void enableMocking().then(render);
