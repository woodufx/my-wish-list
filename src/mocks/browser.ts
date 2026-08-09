import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { DEMO_GUEST_TOKEN } from './fixtures';

export const worker = setupWorker(...handlers);

/**
 * Dev-only affordance: pretend this device is the demo guest so one wish already
 * shows as "reserved by me" on first load. Real guests get a token on their first
 * reservation instead. Only seeds when nothing is stored yet.
 */
export function seedDemoGuest(): void {
  try {
    if (!localStorage.getItem('wishlist.guest-token')) {
      localStorage.setItem('wishlist.guest-token', DEMO_GUEST_TOKEN);
    }
  } catch {
    // storage unavailable — skip seeding
  }
}
