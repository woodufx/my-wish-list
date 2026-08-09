import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import '@/app/styles/global.css';

// NOTE: MSW bootstrap (dev/e2e only) is wired in here during stage 2.

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
