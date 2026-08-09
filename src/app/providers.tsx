import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/config/query-client';
import { CursorBlob, Toaster } from '@/shared/ui';
import { BackgroundScene } from '@/three/BackgroundScene';
import { ErrorBoundary } from '@/app/error-boundary';

/** Composes the global providers that wrap the whole application tree. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BackgroundScene />
        {children}
        <CursorBlob />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
