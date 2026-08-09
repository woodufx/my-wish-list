import { useEffect, useRef, type MutableRefObject } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '@/shared/hooks/useLenis';
import { FLIGHT } from '@/shared/config/motion';

interface ScrollFlight {
  /** Attach to the scene that pins while the cards fly apart. */
  sceneRef: MutableRefObject<HTMLDivElement | null>;
  /** Live flight progress (0 orbit … 1 dispersed). Read imperatively per frame. */
  progressRef: MutableRefObject<number>;
}

/**
 * Pins the orbit scene and maps scroll progress onto `progressRef` via a scrubbed
 * ScrollTrigger, synced with Lenis. Scrolling back reverses along the same path.
 */
export function useScrollFlight(): ScrollFlight {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);

  useLenis(true);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return undefined;
    }

    const trigger = ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: `+=${FLIGHT.distance}`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return { sceneRef, progressRef };
}
