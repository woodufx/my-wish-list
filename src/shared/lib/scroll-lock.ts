// Global scroll lock shared by full-screen overlays (the wish detail sheet).
// Freezes the page behind the overlay so a swipe on the sheet can't scroll the
// list underneath or trigger iOS pull-to-refresh. Prefers pausing the active
// Lenis instance (the orbit screen owns one); otherwise locks native scroll.

interface Pausable {
  stop: () => void;
  start: () => void;
}

let lenis: Pausable | null = null;
let locks = 0;

/** OrbitFlightScene's Lenis registers here so overlays can freeze it. */
export function registerLenis(instance: Pausable | null): void {
  lenis = instance;
}

/** Freeze scrolling. Ref-counted, so nested/overlapping overlays are safe. */
export function lockScroll(): void {
  locks += 1;
  if (locks > 1) {
    return;
  }
  if (lenis) {
    // Lenis.stop() preventDefaults touch/wheel, which also kills pull-to-refresh.
    lenis.stop();
  } else {
    // Native-scroll screens (list / panels): freeze the document.
    document.documentElement.style.overflow = 'hidden';
  }
}

/** Release one lock; restores scrolling once the last overlay closes. */
export function unlockScroll(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0) {
    return;
  }
  document.documentElement.style.overflow = '';
  lenis?.start();
}
