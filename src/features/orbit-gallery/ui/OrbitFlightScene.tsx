import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WishPublic } from '@/entities/wish';
import type { Wishlist } from '@/entities/wishlist';
import { useLenis } from '@/shared/hooks/useLenis';
import { cn } from '@/shared/lib/cn';
import { ORBIT, SCENE } from '@/shared/config/motion';
import { resetStageSync, stageSync } from '@/shared/lib/stage-sync';
import { FrontModels3D } from '@/three/FrontModels3D';
import { curveAt, inOut, outCubic, sizeFromSpin, spinCurve } from '../model/flight-math';
import { MorphCard } from './MorphCard';
import styles from './OrbitFlightScene.module.css';

const SPIN_LUT = spinCurve();
/** Two full turns before it settles booked. */
const TURNS = 720;

/** State for the reservation fly-out currently playing on a single card. */
interface FlightAnim {
  i: number;
  start: number;
  booking: boolean;
  out: number;
  hold: number;
  back: number;
  dur: number;
  spin: number;
  size: number;
  pos: number;
  z: number;
  bob: number;
  env: number;
}

interface OrbitFlightSceneProps {
  wishes: WishPublic[];
  wishlist?: Wishlist;
  booked: number;
  pendingId?: string;
  /** Plays the intro reveal once the loader has dissolved. */
  revealed?: boolean;
  onOpen: (wish: WishPublic, rect?: DOMRect | null) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

const TWO_PI = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** How fast the card morph clock chases the scroll. Higher = the cards start
 * sooner and settle quicker (less lag behind the snap); lower = more delay. */
const MORPH_LERP = 0.05;

/** Stage px the orbit rises across the pre-snap drift zone. */
const DRIFT_LIFT = 150;
/** Scroll snap durations (seconds) for entering the list / returning to orbit. */
const SNAP_FWD_DUR = 1.8;
const SNAP_BACK_DUR = 2.4;

/** Shared snap state between the rAF loop and the "view list" button. */
interface SnapState {
  snapping: boolean;
  atList: boolean;
  cooldown: number;
}

export function OrbitFlightScene({
  wishes,
  wishlist,
  booked,
  revealed,
  onOpen,
  onToggleReservation,
}: OrbitFlightSceneProps) {
  const lenisRef = useLenis(true);
  const snapRef = useRef<SnapState>({ snapping: false, atList: false, cooldown: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const s2Ref = useRef<HTMLDivElement>(null);
  const s2TypeRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<FlightAnim | null>(null);
  const [scale, setScale] = useState(1);
  const [viewportH, setViewportH] = useState(() =>
    typeof window === 'undefined' ? SCENE.height : window.innerHeight,
  );

  /** Kick off the reservation fly-out on the card at `index`. */
  const triggerFlight = (index: number, booking: boolean) => {
    // matches the design: a long hold on the card to show it's booked; cancel is
    // softer/slower than before so it doesn't snap.
    const t = booking ? { out: 900, hold: 1700, back: 1300 } : { out: 620, hold: 500, back: 950 };
    flightRef.current = {
      i: index,
      start: performance.now(),
      booking,
      out: t.out,
      hold: t.hold,
      back: t.back,
      dur: t.out + t.hold + t.back,
      spin: 0,
      size: 0,
      pos: 0,
      z: 0,
      bob: 0,
      env: 0,
    };
  };

  const count = wishes.length;
  // Stage-Y the last panel should reach at full scroll (comfortably in view).
  const listEndY = SCENE.centerY - 40;
  const listSpan = Math.max(0, SCENE.baseY + Math.max(0, count - 1) * SCENE.step - listEndY);
  // Include the viewport height so the *reachable* scroll (maxS = height - viewport)
  // is independent of viewport/zoom — otherwise the last card can't be reached at
  // some zoom levels.
  const totalHeight = SCENE.hold + SCENE.flight + listSpan + viewportH;

  useLayoutEffect(() => {
    const fit = () => {
      // cover the viewport, but cap the upscale so the cards stay crisp (scaling
      // composited card layers up past this gets soft). The 3D + backdrop fill the
      // remaining edges on very large screens.
      const cover = Math.max(window.innerWidth / SCENE.width, window.innerHeight / SCENE.height);
      setScale(Math.min(cover, 1.15));
      setViewportH(window.innerHeight);
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

    const lon = Array.from({ length: count }, (_, i) => (i * TWO_PI) / count);
    const base = TWO_PI / (ORBIT.fullTurnSeconds * 60);
    const stag = SCENE.cardStagger;
    const span = 1 - stag * (count - 1);
    const faces = slotRefs.current.map((slot) => ({
      c: slot?.querySelector<HTMLElement>('[data-c]') ?? null,
      w: slot?.querySelector<HTMLElement>('[data-w]') ?? null,
      back: slot?.querySelector<HTMLElement>('[data-back]') ?? null,
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

    // One pointer path for mouse and touch. A gesture only starts rotating the
    // orbit once it's clearly horizontal (so vertical swipes still scroll to the
    // list); then the pointer is captured so the drag survives leaving the stage.
    let downId = -1;
    let startX = 0;
    let startY = 0;
    let decided = false;

    const onPointerDown = (event: PointerEvent) => {
      downId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      decided = false;
      dragging = false;
      moved = 0;
    };
    const onPointerMove = (event: PointerEvent) => {
      // pointer parallax always tracks the cursor
      const rect = stage.getBoundingClientRect();
      const s = rect.width / SCENE.width;
      mx = (event.clientX - rect.left) / s;
      my = (event.clientY - rect.top) / s;

      if (event.pointerId !== downId) {
        return;
      }
      if (!decided) {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          decided = true;
          if (Math.abs(dx) > Math.abs(dy)) {
            dragging = true;
            try {
              stage.setPointerCapture(event.pointerId);
            } catch {
              // capture unsupported — window listeners still deliver moves
            }
          } else {
            downId = -1; // vertical gesture: let it scroll
          }
        }
      }
      if (dragging) {
        vel += (event.clientX - lastX) * 0.00028;
        moved += Math.abs(event.clientX - lastX);
        lastX = event.clientX;
      }
    };
    const endDrag = (event: PointerEvent) => {
      if (dragging) {
        try {
          stage.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
      dragging = false;
      downId = -1;
    };
    const onClickCapture = (event: MouseEvent) => {
      if (moved > 6) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
    // pointermove on window so it fires for every real move (the front canvas
    // etc. would otherwise swallow delivery to the stage); the capture keeps the
    // drag alive once it has started.
    stage.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    stage.addEventListener('click', onClickCapture, true);

    const frame = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.667);
      last = now;

      const maxS = container.offsetHeight - window.innerHeight;
      const S = Math.max(0, Math.min(maxS, window.scrollY - container.offsetTop));
      const gpRaw = clamp01((S - SCENE.hold) / SCENE.flight);
      gp += (gpRaw - gp) * MORPH_LERP * dt;
      const listScroll = Math.max(0, S - (SCENE.hold + SCENE.flight));

      // Two-screen snap: past the drift threshold the view jumps to the list;
      // above the list top it snaps back to the orbit — no resting between.
      const listTop = SCENE.hold + SCENE.flight;
      const lenis = lenisRef.current;
      const snap = snapRef.current;
      if (lenis && !snap.snapping && now > snap.cooldown) {
        if (!snap.atList && S >= SCENE.hold) {
          snap.snapping = true;
          lenis.scrollTo(container.offsetTop + listTop, {
            duration: SNAP_FWD_DUR,
            lock: true,
            force: true,
            easing: easeInOut,
            onComplete: () => {
              snap.snapping = false;
              snap.atList = true;
              snap.cooldown = performance.now() + 260;
            },
          });
        } else if (snap.atList && S < listTop - 8) {
          snap.snapping = true;
          lenis.scrollTo(container.offsetTop, {
            duration: SNAP_BACK_DUR,
            lock: true,
            force: true,
            easing: easeInOut,
            onComplete: () => {
              snap.snapping = false;
              snap.atList = false;
              snap.cooldown = performance.now() + 260;
            },
          });
        }
      }

      // the orbit lifts slightly as you scroll the drift zone, so when the morph
      // begins the cards are already high and appear to fly down into the list
      const orbitLift = clamp01(S / SCENE.hold) * DRIFT_LIFT;

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

      // reservation fly-out (a single card) + the booking wave that pushes the 3D
      const flight = flightRef.current;
      let waveVal = 0;
      if (flight) {
        const at = now - flight.start;
        const p = Math.min(1, at / flight.dur);
        flight.spin = flight.booking ? TURNS * curveAt(SPIN_LUT, p) : 0;
        flight.size = flight.booking ? sizeFromSpin(flight.spin, TURNS) : 0;
        if (at < flight.out) {
          const e = outCubic(at / flight.out);
          flight.pos = e;
          flight.z = e;
          flight.bob = 0;
        } else if (at < flight.out + flight.hold) {
          const hq = (at - flight.out) / flight.hold;
          flight.pos = 1;
          flight.z = 1;
          flight.bob = Math.sin(hq * Math.PI) * 16;
        } else {
          const e = inOut(Math.min(1, (at - flight.out - flight.hold) / flight.back));
          flight.pos = 1 - e;
          flight.z = 1 - e;
          flight.bob = (1 - e) * 4;
        }
        const burst = (at - flight.out * 0.45) / 260;
        flight.env = Math.exp(-burst * burst);
        waveVal = (0.5 - 0.5 * Math.cos(2 * Math.PI * p)) * (flight.booking ? 1 : 0.4);
        if (at >= flight.dur) {
          flightRef.current = null;
        }
      }
      stageSync.wave = waveVal;
      if (flashRef.current) {
        flashRef.current.style.opacity = flight ? (flight.env * 0.7).toFixed(3) : '0';
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
        const oy = SCENE.centerY + Math.cos(th) * SCENE.radiusY - orbitLift;
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

        // fly-out overrides for the card being reserved: to viewer, spin, return
        let fw = w;
        let fh = h;
        let fx = cx;
        let fy = cy;
        let fyaw = yaw;
        let fz = 0;
        let fsc = 1;
        if (flight && flight.i === i) {
          const m = flight.size;
          fw = w + (236 - w) * m;
          fh = h + (340 - h) * m;
          fsc = 1 + (flight.booking ? 0.5 : 0.12) * flight.pos;
          fz = flight.z * (flight.booking ? 380 : 130);
          fx = cx + (720 - cx) * flight.pos;
          fy = cy + (440 - cy) * flight.pos + flight.bob;
          fyaw = yaw * (1 - flight.pos) + flight.spin;
        }

        el.style.width = `${fw.toFixed(1)}px`;
        el.style.height = `${fh.toFixed(1)}px`;
        el.style.transform = `translate3d(${(fx - fw / 2).toFixed(1)}px, ${(fy - fh / 2).toFixed(1)}px, ${fz.toFixed(1)}px) rotateY(${fyaw.toFixed(1)}deg) rotateX(${(-tilt).toFixed(1)}deg) rotate(${roll.toFixed(1)}deg) scale(${fsc.toFixed(3)})`;

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

        if (flight && flight.i === i) {
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.filter = 'none';
          el.style.zIndex = '220';
          el.style.pointerEvents = 'none';
        }

        // the booking morph collapses the panel layout back to the portrait card,
        // so the faces must follow it — not just the scroll morph `t`.
        const morph = flight && flight.i === i && flight.booking ? flight.size : 0;
        const tw = t * (1 - morph);
        const face = faces[i];
        // while the card spins past edge-on its back is toward us: hide the content
        // faces and reveal the "хочу" branded back, as in the design.
        const spinMod = (((fyaw % 360) + 360) % 360) - 180;
        const isBack = Math.abs(spinMod) < 90;
        if (face.back) {
          face.back.style.opacity = isBack ? '1' : '0';
        }
        if (face.c) {
          face.c.style.opacity = isBack ? '0' : clamp01(1 - tw * 1.9).toFixed(3);
        }
        if (face.w) {
          face.w.style.opacity = isBack ? '0' : clamp01(tw * 1.9 - 0.9).toFixed(3);
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      stage.removeEventListener('click', onClickCapture, true);
      resetStageSync();
    };
    // Only re-init when the number of cards changes — NOT when their reservation
    // status changes (that would reset the orbit/scroll and interrupt the fly-out).
    // lenisRef is a stable ref, listed only to satisfy exhaustive-deps.
  }, [count, lenisRef]);

  const scrollToList = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const target = container.offsetTop + SCENE.hold + SCENE.flight;
    const lenis = lenisRef.current;
    const snap = snapRef.current;
    if (lenis) {
      snap.snapping = true;
      lenis.scrollTo(target, {
        duration: SNAP_FWD_DUR,
        lock: true,
        force: true,
        easing: easeInOut,
        onComplete: () => {
          snap.snapping = false;
          snap.atList = true;
          snap.cooldown = performance.now() + 260;
        },
      });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  return (
    <>
      <FrontModels3D />
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
            <div ref={flashRef} className={styles.flash} />

            {/* screen-1 chrome */}
            <div className={cn(styles.hero, revealed && styles.heroIn)} data-s1="">
              <div className={styles.heroTitleMask}>
                <h1 className={styles.heroTitle}>
                  СПИСОК
                  <br />
                  ЖЕЛАНИЙ
                </h1>
              </div>
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
                <span className={styles.s2Ghost}>{count} ЖЕЛАНИЙ</span>
                <span className={styles.s2Fill}>{count} ЖЕЛАНИЙ</span>
                <span className={styles.s2Sheen}>{count} ЖЕЛАНИЙ</span>
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
                    onOpen(wish, slotRefs.current[index]?.getBoundingClientRect());
                  }}
                  onToggleReservation={() => {
                    triggerFlight(index, wish.reservationStatus === 'free');
                    onToggleReservation(wish);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
