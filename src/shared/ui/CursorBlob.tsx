import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import styles from './CursorBlob.module.css';

const LERP = 0.08;
const BLOB_HALF = 240;

/**
 * A blurred color pool that chases the pointer via lerp and stretches along the
 * direction of movement, blended over the scene. Not rendered under reduced motion.
 */
export function CursorBlob() {
  const reducedMotion = usePrefersReducedMotion();
  const blobRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let last = performance.now();

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };
    window.addEventListener('pointermove', onMove);

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.667);
      last = now;
      x += (targetX - x) * LERP * dt;
      y += (targetY - y) * LERP * dt;

      const vx = targetX - x;
      const vy = targetY - y;
      const speed = Math.hypot(vx, vy);
      const stretch = 1 + Math.min(0.5, speed * 0.006);
      const angle = (Math.atan2(vy, vx) * 180) / Math.PI;

      if (blobRef.current) {
        blobRef.current.style.transform = `translate3d(${x - BLOB_HALF}px, ${y - BLOB_HALF}px, 0) rotate(${angle}deg) scale(${stretch.toFixed(3)}, ${(1 / stretch).toFixed(3)})`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX - 4}px, ${targetY - 4}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return null;
  }

  return (
    <>
      <div ref={blobRef} className={styles.blob} aria-hidden="true" />
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
    </>
  );
}
