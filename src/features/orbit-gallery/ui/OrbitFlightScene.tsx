import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WishPublic } from '@/entities/wish';
import type { Wishlist } from '@/entities/wishlist';
import { useLenis } from '@/shared/hooks/useLenis';
import { cn } from '@/shared/lib/cn';
import { ORBIT, pickScene, type SceneGeom } from '@/shared/config/motion';
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
  /** Freezes the rAF while a full-screen overlay hides the orbit (perf). */
  paused?: boolean;
  onOpen: (wish: WishPublic, rect?: DOMRect | null) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

const TWO_PI = Math.PI * 2;
/** CSS width of the portrait face (`.c`) — the rAF scales it to the slot width. */
const PORTRAIT_FACE_W = 236;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** How fast the card morph clock chases the scroll. Higher = the cards start
 * sooner and settle quicker (less lag behind the snap); lower = more delay. */
const MORPH_LERP = 0.05;

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
  paused = false,
  onOpen,
  onToggleReservation,
}: OrbitFlightSceneProps) {
  const lenisRef = useLenis(true);
  const snapRef = useRef<SnapState>({ snapping: false, atList: false, cooldown: 0 });
  // Latest `paused` for the rAF closure (the loop effect isn't re-created on it).
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

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
    typeof window === 'undefined' ? 880 : window.innerHeight,
  );
  const [scene, setScene] = useState<SceneGeom>(() =>
    pickScene(typeof window === 'undefined' ? 1440 : window.innerWidth),
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
  const listEndY = scene.centerY - 40;
  const listSpan = Math.max(0, scene.baseY + Math.max(0, count - 1) * scene.step - listEndY);
  // Include the viewport height so the *reachable* scroll (maxS = height - viewport)
  // is independent of viewport/zoom — otherwise the last card can't be reached at
  // some zoom levels.
  const totalHeight = scene.hold + scene.flight + listSpan + viewportH;

  useLayoutEffect(() => {
    const fit = () => {
      const next = pickScene(window.innerWidth);
      setScene(next);
      // cover the viewport, but cap the upscale so the cards stay crisp (scaling
      // composited card layers up past this gets soft). The 3D + backdrop fill the
      // remaining edges on very large screens.
      const cover = Math.max(window.innerWidth / next.width, window.innerHeight / next.height);
      // never let the stage grow WIDER than the viewport, or the left-anchored hero
      // and list heading get cropped at square / tall aspect ratios (the empty
      // stage margins letterbox top/bottom instead, filled by the backdrop).
      const widthFit = window.innerWidth / next.width;
      setScale(Math.min(cover, widthFit, 1.15));
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
    const stag = scene.cardStagger;
    const span = 1 - stag * (count - 1);
    const faces = slotRefs.current.map((slot) => ({
      c: slot?.querySelector<HTMLElement>('[data-c]') ?? null,
      w: slot?.querySelector<HTMLElement>('[data-w]') ?? null,
      back: slot?.querySelector<HTMLElement>('[data-back]') ?? null,
      shell: slot?.lastElementChild instanceof HTMLElement ? slot.lastElementChild : null,
    }));
    // query from the scroll container: the scroll-hint button now lives outside
    // the stage (so it can be fixed to the viewport) but still fades on scroll.
    const s1Nodes = [...container.querySelectorAll<HTMLElement>('[data-s1]')];
    const parNodes = [...stage.querySelectorAll<HTMLElement>('[data-par]')];

    let angle = Math.PI * 0.15;
    let vel = 0;
    let gp = 0;
    let pxs = 0;
    let pys = 0;
    let mx = scene.width / 2;
    let my = scene.height / 2;
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
      const s = rect.width / scene.width;
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
      // Fully occluded by an open overlay: keep the loop alive but skip all the
      // per-card layout/paint work (that was dropping the card animation to ~40fps).
      if (pausedRef.current) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(3, (now - last) / 16.667);
      last = now;

      const maxS = container.offsetHeight - window.innerHeight;
      const S = Math.max(0, Math.min(maxS, window.scrollY - container.offsetTop));
      const gpRaw = clamp01((S - scene.hold) / scene.flight);
      gp += (gpRaw - gp) * MORPH_LERP * dt;
      const listScroll = Math.max(0, S - (scene.hold + scene.flight));

      // Two-screen snap: past the drift threshold the view jumps to the list;
      // above the list top it snaps back to the orbit — no resting between.
      const listTop = scene.hold + scene.flight;
      const lenis = lenisRef.current;
      const snap = snapRef.current;
      if (lenis && !snap.snapping && now > snap.cooldown) {
        if (!snap.atList && S >= scene.hold) {
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
      const orbitLift = clamp01(S / scene.hold) * scene.driftLift;

      // pointer parallax
      pxs += (mx / scene.width - 0.5 - pxs) * 0.05 * dt;
      pys += (my / scene.height - 0.5 - pys) * 0.05 * dt;

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
        const y = scene.s2Base - S * 0.58 - pys * 26;
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
        const osc = scene.oscBase + scene.oscRange * d;
        const ox = scene.centerX + Math.sin(th) * scene.radiusX;
        const oy = scene.centerY + Math.cos(th) * scene.radiusY - orbitLift;
        const ow = scene.cardW * osc;
        const oh = scene.cardH * osc;

        const py = scene.baseY + i * scene.step - listScroll;
        const pw = scene.panelW;
        const ph = scene.panelH;
        const px = scene.panelX;

        const raw = clamp01((gp - i * stag) / span);
        const t = easeInOut(raw);
        const arc =
          Math.sin(Math.PI * t) * (i % 2 ? 1 : -1) * (scene.arcBase + (i % 3) * scene.arcStep);
        const lift = Math.sin(Math.PI * t) * -70;

        const cx = ox + (px - ox) * t + arc;
        const cy = oy + (py - oy) * t + lift;
        const w = ow + (pw - ow) * t;
        const h = oh + (ph - oh) * t;
        const yaw = -Math.sin(th) * scene.yaw * (1 - t);
        const roll = Math.sin(Math.PI * t) * (i % 2 ? 9 : -9);
        const tilt =
          t > 0.85 ? Math.max(-9, Math.min(9, (cy - scene.morphY) / 46)) * ((t - 0.85) / 0.15) : 0;

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
          fw = w + (scene.bookW - w) * m;
          fh = h + (scene.bookH - h) * m;
          fsc = 1 + (flight.booking ? scene.bookScale : scene.cancelScale) * flight.pos;
          fz = flight.z * (flight.booking ? scene.bookZ : scene.cancelZ);
          fx = cx + (scene.morphX - cx) * flight.pos;
          fy = cy + (scene.morphY - cy) * flight.pos + flight.bob;
          fyaw = yaw * (1 - flight.pos) + flight.spin;
        }

        el.style.width = `${fw.toFixed(1)}px`;
        el.style.height = `${fh.toFixed(1)}px`;
        el.style.transform = `translate3d(${(fx - fw / 2).toFixed(1)}px, ${(fy - fh / 2).toFixed(1)}px, ${fz.toFixed(1)}px) rotateY(${fyaw.toFixed(1)}deg) rotateX(${(-tilt).toFixed(1)}deg) rotate(${roll.toFixed(1)}deg) scale(${fsc.toFixed(3)})`;

        const offscreen = cy < -420 || cy > scene.height + 460;
        el.style.visibility = offscreen ? 'hidden' : 'visible';
        let naturalOpacity: number;
        if (scene.vertical) {
          // mobile: a focused carousel — only the front few cards read, the rest
          // fall away sharply (as in the mobile mockup)
          const near = clamp01((d - 0.72) / 0.28);
          naturalOpacity =
            t > 0.9
              ? Math.max(0.45, 1 - Math.abs(cy - scene.morphY) / 780)
              : 0.02 + 0.98 * near ** 2.2;
          // PERF (mobile): no per-card filter at all. A filter forces its own
          // compositing layer that repaints as the card moves; the steep opacity
          // falloff above already carries the depth read on a phone.
          el.style.filter = 'none';
        } else {
          naturalOpacity =
            t > 0.9 ? Math.max(0.35, 1 - Math.abs(cy - scene.morphY) / 900) : 0.1 + 0.9 * d ** 1.15;
          el.style.filter =
            t < 0.5 && d < 0.86
              ? `blur(${((0.86 - d) * 9 * (1 - t * 2)).toFixed(2)}px) brightness(${(0.42 + 0.58 * d).toFixed(2)})`
              : 'none';
        }
        el.style.opacity = naturalOpacity.toFixed(3);
        el.style.zIndex = String(
          t > 0.5 ? Math.round(200 - Math.abs(cy - scene.morphY) / 8) : Math.round(d * 100),
        );
        el.style.pointerEvents = offscreen ? 'none' : t > 0.6 || d > 0.72 ? 'auto' : 'none';

        if (flight && flight.i === i) {
          el.style.visibility = 'visible';
          // Blend the natural carousel opacity → full while flown out (pos≈1) and
          // ease it back as the card returns (pos→0), so the brightness doesn't
          // snap the instant the flight ends.
          el.style.opacity = (naturalOpacity + (1 - naturalOpacity) * flight.pos).toFixed(3);
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
        // the backdrop-filter glass rasterizes badly when the card scales/spins
        // during the fly-out (very blurry on high-DPI phones) — drop it while flying
        if (face.shell) {
          face.shell.style.backdropFilter = flight && flight.i === i ? 'none' : '';
        }
        if (face.back) {
          face.back.style.opacity = isBack ? '1' : '0';
        }
        if (face.c) {
          face.c.style.opacity = isBack ? '0' : clamp01(1 - tw * 1.9).toFixed(3);
          // scale the fixed-size portrait face (236px in CSS) to the current slot
          // width so it fits every orbit size (and the smaller mobile cards)
          face.c.style.transform = `scale(${Math.min(1.5, fw / PORTRAIT_FACE_W).toFixed(3)})`;
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
    // Re-init when the card count or the breakpoint geometry changes — NOT when
    // reservation status changes (that would reset the orbit and interrupt the
    // fly-out). lenisRef is a stable ref, listed to satisfy exhaustive-deps.
  }, [count, scene, lenisRef]);

  const scrollToList = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const target = container.offsetTop + scene.hold + scene.flight;
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
            data-vertical={scene.vertical ? '' : undefined}
            style={{
              width: scene.width,
              height: scene.height,
              perspective: `${scene.perspective}px`,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
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
        {/* the scroll hint lives OUTSIDE the transformed stage so it can be fixed
            to the visible viewport bottom (and clear the Safari toolbar) */}
        <button type="button" className={styles.scrollBtn} data-s1="" onClick={scrollToList}>
          <span className={styles.scrollBtnLabel}>смотреть список</span>
          <span className={styles.scrollBtnLine}>
            <span className={styles.scrollBtnDot} />
          </span>
        </button>
      </div>
    </>
  );
}
