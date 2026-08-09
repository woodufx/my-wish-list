import { useCallback, useState } from 'react';
import { ensureGuestToken, getGuestToken } from './token';

/**
 * Exposes the guest token and a way to materialize it. `ensure` is called at the
 * first reservation; before that `token` may be null.
 */
export function useGuest() {
  const [token, setToken] = useState<string | null>(() => getGuestToken());

  const ensure = useCallback(() => {
    const next = ensureGuestToken();
    setToken(next);
    return next;
  }, []);

  return { token, ensureToken: ensure } as const;
}
