import { createHash } from 'node:crypto';

/**
 * Hashes a raw guest token for storage/lookup. The database only ever holds this
 * digest — the raw token stays in the guest's localStorage and the request header.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
