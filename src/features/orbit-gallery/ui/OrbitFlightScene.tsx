import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WishPublic } from '@/entities/wish';
import type { Wishlist } from '@/entities/wishlist';
import { useLenis } from '@/shared/hooks/useLenis';
import { ORBIT, SCENE } from '@/shared/config/motion';
import { resetStageSync, stageSync } from '@/shared/lib/stage-sync';
import { MorphCard } from './MorphCard';
import styles from './OrbitFlightScene.module.css';

interface OrbitFlightSceneProps {
  wishes: WishPublic[];
  wishlist?: Wishlist;
  booked: number;
  pendingId?: string;
  onOpen: (wish: WishPublic) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

const TWO_PI = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function OrbitFlightScene({
  wishes,
  wishlist,
  booked,
  onOpen,
  onToggleReservation,
}: OrbitFlightSceneProps) {
  useLenis(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const s2Ref = useRef<HTMLDivElement>(null);
  const s2TypeRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const count = wishes.length;
  const totalHeight = SCENE.hold + SCENE.flight + Math.max(0, count - 1) * SCENE.step + 900;

  useLayoutEffect(() => {
    const fit = () => {
      // cover the viewport so the cards/orbit fill the screen (no dark frame)
      setScale(Math.max(window.innerWidth / SCENE.width, window.innerHeight / SCENE.height));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) {
      return undefined;
    }

    const lon = wishes.map((_, i) => (i * TWO_PI) / count);
    const base = TWO_PI / (ORBIT.fullTurnSeconds * 60);
    const stag = SCENE.cardStagger;
    const span = 1 - stag * (count - 1);
    const faces = slotRefs.current.map((slot) => ({
      c: slot?.querySelector<HTMLElement>('[data-c]') ?? null,
      w: slot?.querySelector<HTMLElement>('[data-w]') ?? null,
    }));
    const s1Nodes = [...stage.querySelectorAll<HTMLElement>('[data-s1]')];
    const parNodes = [...stage.querySelectorAll<HTMLElement>('[data-par]')];

    let angle = Math.PI * 0.15;
    let vel = 0;
    let gp = 0;
    let pxs = 0;
    let pys = 0;
    let mx = SCENE.width / 2;
    let my = SCENE.height / 2;
    let dragging = false;
    let lastX = 0;
    let moved = 0;
    let raf = 0;
    let last = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const s = rect.width / SCENE.width;
      mx = (event.clientX - rect.left) / s;
      my = (event.clientY - rect.top) / s;
      if (dragging) {
        vel += (event.clientX - lastX) * 0.00028;
        moved += Math.abs(event.clientX - lastX);
        lastX = event.clientX;
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = event.clientX;
    };
    const endDrag = () => {
      dragging = false;
    };
    const onClickCapture = (event: MouseEvent) => {
      if (moved > 6) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', endDrag);
    stage.addEventListener('click', onClickCapture, true);

    const frame = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.667);
      last = now;

      const maxS = container.offsetHeight - window.innerHeight;
      const S = Math.max(0, Math.min(maxS, window.scrollY - container.offsetTop));
      const gpRaw = clamp01((S - SCENE.hold) / SCENE.flight);
      gp += (gpRaw - gp) * 0.14 * dt;
      const listScroll = Math.max(0, S - (SCENE.hold + SCENE.flight));

      // pointer parallax
      pxs += (mx / SCENE.width - 0.5 - pxs) * 0.05 * dt;
      pys += (my / SCENE.height - 0.5 - pys) * 0.05 * dt;

      // feed the 3D background layer
      stageSync.scroll = S;
      stageSync.px = pxs;
      stageSync.py = pys;
      stageSync.flight = gp;

      for (const node of parNodes) {
        const f = Number.parseFloat(node.dataset.par ?? '0.2');
        const sf = Number.parseFloat(node.dataset.sf ?? '0');
        node.style.transform = `translate3d(${(-pxs * f * 140).toFixed(1)}px, ${(-pys * f * 140 - S * sf).toFixed(1)}px, 0)`;
      }

      // orbit rotation (stops during flight)
      if (!dragging) {
        vel *= ORBIT.dragDamping ** dt;
      }
      angle += (base + vel) * (1 - gp) * dt;

      // screen-1 chrome leaves
      const out = clamp01(S / 460);
      for (const node of s1Nodes) {
        node.style.opacity = (1 - out).toFixed(3);
        node.style.pointerEvents = out > 0.3 ? 'none' : 'auto';
      }

      // screen-2 "12 ЖЕЛАНИЙ" arrives
      const s2 = s2Ref.current;
      if (s2) {
        const y = 1020 - S * 0.58 - pys * 26;
        s2.style.transform = `translate3d(${(-pxs * 34).toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        const rv = clamp01((S - 260) / 420);
        s2.style.opacity = rv.toFixed(3);
        const s2t = s2TypeRef.current;
        if (s2t) {
          s2t.style.clipPath = `inset(0 0 ${((1 - rv) * 100).toFixed(1)}% 0)`;
        }
      }

      // rail progress
      const rail = railRef.current;
      if (rail?.parentElement) {
        const track = rail.parentElement.clientHeight;
        const p = maxS > 0 ? S / maxS : 0;
        rail.style.top = `${(p * (track - rail.offsetHeight)).toFixed(1)}px`;
      }

      // cards: orbit -> panel morph
      for (let i = 0; i < count; i++) {
        const el = slotRefs.current[i];
        if (!el) {
          continue;
        }
        const th = lon[i] + angle;
        const oz = Math.cos(th);
        const d = (oz + 1) / 2;
        const osc = 0.6 + 0.5 * d;
        const ox = SCENE.centerX + Math.sin(th) * SCENE.radiusX;
        const oy = SCENE.centerY + Math.cos(th) * SCENE.radiusY;
        const ow = 236 * osc;
        const oh = 340 * osc;

        const py = SCENE.baseY + i * SCENE.step - listScroll;
        const pw = 1120;
        const ph = 320;
        const px = 720;

        const raw = clamp01((gp - i * stag) / span);
        const t = easeInOut(raw);
        const arc = Math.sin(Math.PI * t) * (i % 2 ? 1 : -1) * (110 + (i % 3) * 55);
        const lift = Math.sin(Math.PI * t) * -70;

        const cx = ox + (px - ox) * t + arc;
        const cy = oy + (py - oy) * t + lift;
        const w = ow + (pw - ow) * t;
        const h = oh + (ph - oh) * t;
        const yaw = -Math.sin(th) * 26 * (1 - t);
        const roll = Math.sin(Math.PI * t) * (i % 2 ? 9 : -9);
        const tilt =
          t > 0.85 ? Math.max(-9, Math.min(9, (cy - 440) / 46)) * ((t - 0.85) / 0.15) : 0;

        el.style.width = `${w.toFixed(1)}px`;
        el.style.height = `${h.toFixed(1)}px`;
        el.style.transform = `translate3d(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px, 0) rotateY(${yaw.toFixed(1)}deg) rotateX(${(-tilt).toFixed(1)}deg) rotate(${roll.toFixed(1)}deg)`;

        const offscreen = cy < -420 || cy > 1320;
        el.style.visibility = offscreen ? 'hidden' : 'visible';
        el.style.opacity = (
          t > 0.9 ? Math.max(0.35, 1 - Math.abs(cy - 440) / 900) : 0.1 + 0.9 * d ** 1.15
        ).toFixed(3);
        el.style.filter =
          t < 0.5 && d < 0.86
            ? `blur(${((0.86 - d) * 9 * (1 - t * 2)).toFixed(2)}px) brightness(${(0.42 + 0.58 * d).toFixed(2)})`
            : 'none';
        el.style.zIndex = String(
          t > 0.5 ? Math.round(200 - Math.abs(cy - 440) / 8) : Math.round(d * 100),
        );
        el.style.pointerEvents = offscreen ? 'none' : t > 0.6 || d > 0.72 ? 'auto' : 'none';

        const face = faces[i];
        if (face.c) {
          face.c.style.opacity = clamp01(1 - t * 1.9).toFixed(3);
        }
        if (face.w) {
          face.w.style.opacity = clamp01(t * 1.9 - 0.9).toFixed(3);
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('click', onClickCapture, true);
      resetStageSync();
    };
  }, [wishes, count]);

  const scrollToList = () => {
    const container = containerRef.current;
    if (container) {
      window.scrollTo({
        top: container.offsetTop + SCENE.hold + SCENE.flight + 120,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div ref={containerRef} className={styles.scroll} style={{ height: totalHeight }}>
      <div className={styles.sticky}>
        <div
          ref={stageRef}
          className={styles.stage}
          style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
        >
          {/* 2D pseudo-3D backdrop */}
          <div className={styles.bands} data-par="0.06" data-sf="0.1">
            <div className={`${styles.band} ${styles.band1}`} />
            <div className={`${styles.band} ${styles.band2}`} />
            <div className={`${styles.band} ${styles.band3}`} />
          </div>
          <div className={styles.pool} data-par="0.12" data-sf="0.2" />
          <div className={`${styles.blob} ${styles.blobA}`} data-par="0.42" data-sf="0.5">
            <div />
          </div>
          <div className={`${styles.blob} ${styles.blobB}`} data-par="0.24" data-sf="0.35">
            <div />
          </div>
          <div className={`${styles.blob} ${styles.blobC}`} data-par="0.5" data-sf="0.62">
            <div />
          </div>
          <div className={styles.glowA} data-par="0.62" data-sf="1.15" />
          <div className={styles.glowB} data-par="0.8" data-sf="1.4" />
          <div className={styles.vig} />

          {/* screen-1 chrome */}
          <div className={styles.hero} data-s1="">
            <h1 className={styles.heroTitle}>
              СПИСОК
              <br />
              ЖЕЛАНИЙ
            </h1>
            {wishlist && (
              <>
                <p className={styles.heroNote}>
                  {wishlist.note ?? `Список ${wishlist.ownerName}.`}
                </p>
                <p className={`eyebrow ${styles.heroMeta}`}>
                  {count} желаний · {booked} забронированы
                </p>
              </>
            )}
          </div>

          <button type="button" className={styles.scrollBtn} data-s1="" onClick={scrollToList}>
            <span className={styles.scrollBtnLabel}>смотреть список</span>
            <span className={styles.scrollBtnLine}>
              <span className={styles.scrollBtnDot} />
            </span>
          </button>

          {/* screen-2 heading */}
          <div ref={s2Ref} className={styles.s2}>
            <div ref={s2TypeRef} className={styles.s2Type}>
              <span>{count} ЖЕЛАНИЙ</span>
            </div>
            <div className={styles.s2Row}>
              <span className={styles.s2Label}>Список целиком</span>
              <span className={styles.s2Rule} />
              <span className={styles.s2Right}>{booked} забронированы</span>
            </div>
          </div>

          {/* rail */}
          <div className={styles.railTrack}>
            <div ref={railRef} className={styles.rail} />
          </div>

          {/* cards */}
          {wishes.map((wish, index) => (
            <div
              key={wish.id}
              ref={(element) => {
                slotRefs.current[index] = element;
              }}
              className={styles.slot}
            >
              <span className={styles.cardGlow} aria-hidden="true" />
              <MorphCard
                wish={wish}
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
      </div>
    </div>
  );
}
