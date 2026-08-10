/**
 * Single source of truth for animation timing and physics. No magic numbers in
 * components — everything scroll/orbit/spring related is named here.
 */

export const ORBIT = {
  /** Ellipse half-width / half-height of the card ring, in px. */
  radiusX: 430,
  radiusY: 70,
  /** How far front/back cards travel in z, in px. */
  depth: 260,
  /** One full revolution, in seconds (~60s per the brief). */
  fullTurnSeconds: 60,
  /** Drag momentum decays by this factor each frame. */
  dragDamping: 0.94,
  /** How quickly the ring eases back to its base speed after a drag. */
  returnToBaseRate: 0.03,
  /** Perspective applied to the stage, in px. */
  perspective: 1600,
  /** Depth scaling: back cards shrink to this, front cards reach 1. */
  minScale: 0.62,
} as const;

export const FLIGHT = {
  /** Scroll distance (px) the pinned flight spans. */
  distance: 1100,
  /** Per-card dispersal offset as a fraction of total progress (~80ms feel). */
  staggerStep: 0.045,
  /** How far cards fly toward the viewer at full dispersal, in px. */
  zBurst: 620,
} as const;

/**
 * Single-scene scroll choreography (ported from the design's first screen). All
 * distances are in the logical 1440×880 stage's pixels.
 */
export const SCENE = {
  width: 1440,
  height: 880,
  /** Scroll (px) the orbit holds before the flight starts. */
  hold: 520,
  /** Scroll (px) the orbit→panels flight spans. */
  flight: 1000,
  /** Vertical spacing between stacked panels. */
  step: 420,
  /** Y of the first panel in the stage. */
  baseY: 560,
  /** Orbit ellipse radii and centre. */
  radiusX: 415,
  radiusY: 52,
  centerX: 864,
  centerY: 458,
  /** Per-card flight stagger (fraction of progress). */
  cardStagger: 0.016,
} as const;

export const LENIS = {
  lerp: 0.1,
  wheelMultiplier: 1,
} as const;

/** Motion spring/timings for component transitions (Motion / GSAP). */
export const SPRING = {
  soft: { type: 'spring', stiffness: 210, damping: 26 },
  /** Reservation flight: overshoots, ~1.8s settle. */
  reserve: { type: 'spring', stiffness: 90, damping: 12, mass: 1.1 },
} as const;

export const DURATION = {
  fast: 0.18,
  base: 0.45,
  slow: 0.9,
  /** Reservation choreography total, in seconds. */
  reserve: 1.8,
} as const;

export const EASE = {
  out: [0.2, 0.7, 0.2, 1] as const,
};
