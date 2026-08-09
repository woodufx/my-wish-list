const STORAGE_KEY = 'wishlist.guest-token';

/** Reads the guest token, or null if this device has never reserved anything. */
export function getGuestToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns the guest token, generating and persisting one on first call. Meant to
 * run at the moment of the first reservation — guests are never registered.
 */
export function ensureGuestToken(): string {
  const existing = getGuestToken();
  if (existing) {
    return existing;
  }
  const token = crypto.randomUUID();
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode) — fall back to an in-memory token.
  }
  return token;
}
