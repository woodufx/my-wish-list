import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LENIS } from '@/shared/config/motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Enables Lenis inertial scrolling and keeps GSAP ScrollTrigger in sync with it.
 * Disabled (native scroll) when `enabled` is false — e.g. under reduced motion.
 */
export function useLenis(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const lenis = new Lenis({ lerp: LENIS.lerp, wheelMultiplier: LENIS.wheelMultiplier });
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
    };
  }, [enabled]);
}
