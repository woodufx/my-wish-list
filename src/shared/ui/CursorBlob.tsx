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
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    // On touch there's no cursor to trail — the blob becomes a glow that appears
    // under the finger on contact and fades on release; the dot is hidden.
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let last = performance.now();

    if (coarse) {
      if (blobRef.current) {
        blobRef.current.style.opacity = '0';
        blobRef.current.style.transition = 'opacity 0.35s ease';
      }
      if (dotRef.current) {
        dotRef.current.style.display = 'none';
      }
    }

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };
    const onTouchStart = (event: PointerEvent) => {
      if (!coarse || event.pointerType !== 'touch') {
        return;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      x = targetX;
      y = targetY;
      if (blobRef.current) {
        blobRef.current.style.opacity = '1';
      }
    };
    const onTouchEnd = () => {
      if (coarse && blobRef.current) {
        blobRef.current.style.opacity = '0';
      }
    };
    // reveal a contextual label when hovering an element that declares one
    const onOver = (event: PointerEvent) => {
      const { target } = event;
      const labelled =
        target instanceof Element ? target.closest<HTMLElement>('[data-cursor-label]') : null;
      const label = labelRef.current;
      if (!label) {
        return;
      }
      const text = labelled?.dataset.cursorLabel ?? '';
      if (text) {
        label.textContent = text;
        label.dataset.on = 'true';
      } else {
        label.dataset.on = 'false';
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerover', onOver);
    window.addEventListener('pointerdown', onTouchStart);
    window.addEventListener('pointerup', onTouchEnd);
    window.addEventListener('pointercancel', onTouchEnd);

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
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${targetX + 18}px, ${targetY + 14}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onTouchStart);
      window.removeEventListener('pointerup', onTouchEnd);
      window.removeEventListener('pointercancel', onTouchEnd);
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
      <div ref={labelRef} className={styles.label} data-on="false" aria-hidden="true" />
    </>
  );
}
