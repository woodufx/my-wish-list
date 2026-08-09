import { useEffect, useRef, type MutableRefObject } from 'react';
import { WishCard, type WishPublic } from '@/entities/wish';
import { ORBIT, FLIGHT } from '@/shared/config/motion';
import styles from './OrbitStage.module.css';

interface OrbitStageProps {
  wishes: WishPublic[];
  /** Flight dispersal progress (0 orbit … 1 dispersed), driven by scroll. */
  progressRef: MutableRefObject<number>;
  pendingId?: string;
  onOpen: (wish: WishPublic) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

const CARD_HALF_W = 118;
const CARD_HALF_H = 170;
const TWO_PI = Math.PI * 2;

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function OrbitStage({
  wishes,
  progressRef,
  pendingId,
  onOpen,
  onToggleReservation,
}: OrbitStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = wishes.length;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return undefined;
    }

    const basePerFrame = TWO_PI / (ORBIT.fullTurnSeconds * 60);
    let angle = Math.PI * 0.15;
    let velocity = 0; // extra angular velocity from dragging
    let dragging = false;
    let lastX = 0;
    let raf = 0;
    let last = performance.now();

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      stage.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      velocity += (event.clientX - lastX) * 0.00028;
      lastX = event.clientX;
    };
    const endDrag = () => {
      dragging = false;
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    const frame = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.667);
      last = now;

      const progress = progressRef.current;
      const flying = progress > 0.01;

      if (!flying) {
        angle += (basePerFrame + velocity) * dt;
      }
      velocity *= Math.pow(ORBIT.dragDamping, dt);
      if (Math.abs(velocity) < 1e-5) {
        velocity = 0;
      }

      const totalStagger = count * FLIGHT.staggerStep;

      slotRefs.current.forEach((slot, index) => {
        if (!slot) {
          return;
        }
        const theta = angle + index * (TWO_PI / count);
        const sin = Math.sin(theta);
        const cos = Math.cos(theta);
        const depthNorm = (sin + 1) / 2; // 0 back … 1 front

        const x = cos * ORBIT.radiusX;
        const y = -sin * ORBIT.radiusY;
        const z = sin * ORBIT.depth;
        const scale = ORBIT.minScale + (1 - ORBIT.minScale) * depthNorm;
        const opacity = 0.35 + 0.65 * depthNorm;
        const rotateY = cos * 12; // slight outward tilt

        // Staggered dispersal: each card leaves a beat after the previous.
        const pc = clamp01(progress * (1 + totalStagger) - index * FLIGHT.staggerStep);
        const spread = 1 + pc * 1.4;
        const fx = x * spread;
        const fy = y * spread - pc * 40;
        const fz = z + pc * FLIGHT.zBurst;
        const fScale = scale * (1 + pc * 0.9);
        const fOpacity = opacity * (1 - pc);

        slot.style.transform = `translate3d(${fx - CARD_HALF_W}px, ${fy - CARD_HALF_H}px, ${fz}px) rotateY(${rotateY}deg) scale(${fScale.toFixed(3)})`;
        slot.style.opacity = fOpacity.toFixed(3);
        slot.style.zIndex = String(Math.round(depthNorm * 100));
        slot.style.pointerEvents = fOpacity < 0.5 ? 'none' : 'auto';
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('pointercancel', endDrag);
    };
  }, [count, progressRef]);

  return (
    <div ref={stageRef} className={styles.stage} style={{ perspective: `${ORBIT.perspective}px` }}>
      {wishes.map((wish, index) => (
        <div
          key={wish.id}
          ref={(element) => {
            slotRefs.current[index] = element;
          }}
          className={styles.slot}
        >
          <WishCard
            wish={wish}
            variant="portrait"
            pending={pendingId === wish.id}
            onOpen={() => {
              onOpen(wish);
            }}
            onToggleReservation={() => {
              onToggleReservation(wish);
            }}
          />
        </div>
      ))}
    </div>
  );
}
