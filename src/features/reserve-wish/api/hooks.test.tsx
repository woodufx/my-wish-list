import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { wishKeys, type WishPublic } from '@/entities/wish';
import { getGuestToken } from '@/entities/guest';
import { setGuestTokenProvider } from '@/shared/api';
import { getToasts } from '@/shared/lib/toast';
import { server } from '@/mocks/server';
import { listWishes, resetDb } from '@/mocks/db';
import { useReserveWish } from './hooks';

const SLUG = 'demo';
const FREE_WISH = '00000000-0000-4000-8000-000000000001';

function seededClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wishes: WishPublic[] = listWishes().map((wish) => ({ ...wish, reservationStatus: 'free' }));
  queryClient.setQueryData(wishKeys.publicList(SLUG), wishes);
  return queryClient;
}

function wrapperFor(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function statusOf(queryClient: QueryClient, wishId: string): string | undefined {
  return queryClient
    .getQueryData<WishPublic[]>(wishKeys.publicList(SLUG))
    ?.find((wish) => wish.id === wishId)?.reservationStatus;
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  setGuestTokenProvider(getGuestToken);
});

afterEach(() => {
  server.resetHandlers();
  resetDb();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});

describe('useReserveWish', () => {
  it('flips status to taken_by_me optimistically and keeps it after success', async () => {
    const queryClient = seededClient();
    const { result } = renderHook(() => useReserveWish(SLUG), { wrapper: wrapperFor(queryClient) });

    act(() => {
      result.current.mutate(FREE_WISH);
    });

    await waitFor(() => {
      expect(statusOf(queryClient, FREE_WISH)).toBe('taken_by_me');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(statusOf(queryClient, FREE_WISH)).toBe('taken_by_me');
  });

  it('rolls back and marks taken_by_other on a 409 conflict', async () => {
    const queryClient = seededClient();
    localStorage.setItem('mock.scenario', 'conflict');
    const before = getToasts().length;

    const { result } = renderHook(() => useReserveWish(SLUG), { wrapper: wrapperFor(queryClient) });

    act(() => {
      result.current.mutate(FREE_WISH);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(statusOf(queryClient, FREE_WISH)).toBe('taken_by_other');
    expect(getToasts().length).toBeGreaterThan(before);
    expect(getToasts().at(-1)?.variant).toBe('error');
  });
});
