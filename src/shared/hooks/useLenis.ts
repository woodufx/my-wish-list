import { useEffect, useRef, type MutableRefObject } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LENIS } from '@/shared/config/motion';
import { registerLenis } from '@/shared/lib/scroll-lock';

gsap.registerPlugin(ScrollTrigger);

/**
 * Enables Lenis inertial scrolling and keeps GSAP ScrollTrigger in sync with it.
 * Disabled (native scroll) when `enabled` is false — e.g. under reduced motion.
 * Returns a ref to the live instance so callers can drive programmatic snaps.
 */
export function useLenis(enabled: boolean): MutableRefObject<Lenis | null> {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const lenis = new Lenis({ lerp: LENIS.lerp, wheelMultiplier: LENIS.wheelMultiplier });
    ref.current = lenis;
    registerLenis(lenis);
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      ref.current = null;
      registerLenis(null);
    };
  }, [enabled]);

  return ref;
}
