import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Rendering budget for the device:
 * - `full`   — capable desktop: WebGL Canvas + the full scroll flight.
 * - `lite`   — phones / low-power / no-WebGL: DOM orbit + flight, no 3D Canvas.
 * - `static` — reduced-motion: no animation, the static panel list.
 */
export type CapabilityTier = 'full' | 'lite' | 'static';

/** Width below which we treat the device as a small/touch screen. */
const SMALL_WIDTH = 900;

let webglCache: boolean | undefined;
/** Whether WebGL is available (cached — the probe allocates a context). */
export function hasWebGL(): boolean {
  if (webglCache === undefined) {
    try {
      const canvas = document.createElement('canvas');
      webglCache = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}

function computeTier(reducedMotion: boolean): CapabilityTier {
  if (reducedMotion || typeof window === 'undefined') {
    return 'static';
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const small = window.innerWidth < SMALL_WIDTH;
  const lowPower = cores < 4 || memory < 4;
  if (small || lowPower || !hasWebGL()) {
    return 'lite';
  }
  return 'full';
}

/**
 * Picks a rendering tier from reduced-motion, device memory / cores and screen
 * width. Canvas mounting and the flight are gated on it (see the 3D scenes and
 * the wishlist page). Reactive to reduced-motion and resize.
 */
export function useCapabilityTier(): CapabilityTier {
  const reducedMotion = usePrefersReducedMotion();
  const [tier, setTier] = useState<CapabilityTier>(() => computeTier(reducedMotion));

  useEffect(() => {
    const update = () => {
      setTier(computeTier(reducedMotion));
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, [reducedMotion]);

  return tier;
}
