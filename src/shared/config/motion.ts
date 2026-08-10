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
/** All orbit/flight geometry for one breakpoint (logical stage px). */
export interface SceneGeom {
  width: number;
  height: number;
  perspective: number;
  /** Scroll (px) the orbit holds before the flight starts. */
  hold: number;
  /** Scroll (px) the orbit→panels flight spans. */
  flight: number;
  /** Vertical spacing between stacked panels. */
  step: number;
  /** Y of the first panel in the stage. */
  baseY: number;
  /** Orbit ellipse radii and centre. */
  radiusX: number;
  radiusY: number;
  centerX: number;
  centerY: number;
  /** Per-card flight stagger (fraction of progress). */
  cardStagger: number;
  /** Orbit card base size and its depth-scale (osc = oscBase + oscRange * depth). */
  cardW: number;
  cardH: number;
  oscBase: number;
  oscRange: number;
  /** Wide panel target size and centre X. */
  panelW: number;
  panelH: number;
  panelX: number;
  /** Centre the reservation fly-out settles on. */
  morphX: number;
  morphY: number;
  /** Orbit yaw amplitude (deg) and the panel arc swing. */
  yaw: number;
  arcBase: number;
  arcStep: number;
  /** Stage px the orbit rises across the drift zone. */
  driftLift: number;
  /** Card size the booking spin shrinks to. */
  bookW: number;
  bookH: number;
  /** Reservation fly-out depth (z px) and extra scale, per booking vs cancel. */
  bookZ: number;
  cancelZ: number;
  bookScale: number;
  cancelScale: number;
  /** Panel inner layout: false = image left/text right, true = image top (mobile). */
  vertical: boolean;
}

/** Desktop / wide screens. */
export const SCENE: SceneGeom = {
  width: 1440,
  height: 880,
  perspective: 1600,
  hold: 520,
  flight: 1000,
  step: 420,
  baseY: 560,
  radiusX: 460,
  radiusY: 76,
  centerX: 794,
  centerY: 428,
  cardStagger: 0.016,
  cardW: 236,
  cardH: 340,
  oscBase: 0.6,
  oscRange: 0.5,
  panelW: 1120,
  panelH: 320,
  panelX: 720,
  morphX: 720,
  morphY: 440,
  yaw: 26,
  arcBase: 110,
  arcStep: 55,
  driftLift: 150,
  bookW: 236,
  bookH: 340,
  bookZ: 380,
  cancelZ: 130,
  bookScale: 0.5,
  cancelScale: 0.12,
  vertical: false,
};

/** Phones / narrow screens (portrait stage, smaller orbit, vertical panels). */
export const SCENE_MOBILE: SceneGeom = {
  width: 390,
  height: 844,
  perspective: 1000,
  hold: 320,
  flight: 900,
  step: 348,
  baseY: 560,
  radiusX: 300,
  radiusY: 22,
  centerX: 195,
  centerY: 500,
  cardStagger: 0.035,
  cardW: 176,
  cardH: 250,
  oscBase: 0.5,
  oscRange: 0.55,
  panelW: 350,
  panelH: 300,
  panelX: 195,
  morphX: 195,
  morphY: 400,
  yaw: 22,
  arcBase: 72,
  arcStep: 26,
  driftLift: 90,
  bookW: 186,
  bookH: 264,
  bookZ: 150,
  cancelZ: 24,
  bookScale: 0.18,
  cancelScale: 0.015,
  vertical: true,
};

/** Width at/below which the mobile scene geometry is used. */
export const MOBILE_MAX_WIDTH = 680;

/** Pick the scene geometry for a viewport width. */
export function pickScene(width: number): SceneGeom {
  return width <= MOBILE_MAX_WIDTH ? SCENE_MOBILE : SCENE;
}

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
