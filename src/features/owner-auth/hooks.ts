import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOwnerSession, ownerLogin, ownerLogout, type OwnerSession } from './api';

export const ownerSessionKey = ['owner', 'session'] as const;

/** Reads whether the current browser holds a valid owner cookie. */
export function useOwnerSession() {
  return useQuery({
    queryKey: ownerSessionKey,
    queryFn: ({ signal }) => fetchOwnerSession(signal),
    staleTime: 5 * 60 * 1000,
    // A 401/failure just means "not the owner" — don't hammer the endpoint.
    retry: false,
  });
}

export function useOwnerLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (secret: string) => ownerLogin(secret),
    onSuccess: (session) => {
      queryClient.setQueryData<OwnerSession>(ownerSessionKey, session);
    },
  });
}

export function useOwnerLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ownerLogout(),
    onSuccess: (session) => {
      queryClient.setQueryData<OwnerSession>(ownerSessionKey, session);
      // The owner's wishes were fetched under the cookie — drop them on logout.
      void queryClient.invalidateQueries();
    },
  });
}
