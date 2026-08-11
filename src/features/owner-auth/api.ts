import { z } from 'zod';
import { http } from '@/shared/api';

/** The owner session state the API reports (and login/logout return). */
export const OwnerSessionSchema = z.object({ authenticated: z.boolean() });
export type OwnerSession = z.infer<typeof OwnerSessionSchema>;

export function fetchOwnerSession(signal?: AbortSignal): Promise<OwnerSession> {
  return http.get('/owner/session', OwnerSessionSchema, signal);
}

/** Exchange the owner secret for a signed httpOnly cookie (set by the server). */
export function ownerLogin(secret: string): Promise<OwnerSession> {
  return http.post('/owner/session', { secret }, OwnerSessionSchema);
}

export function ownerLogout(): Promise<OwnerSession> {
  return http.del('/owner/session', OwnerSessionSchema);
}
