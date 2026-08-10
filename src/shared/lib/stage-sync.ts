/**
 * A tiny mutable bridge between the orbit-flight scene (which owns scroll/pointer
 * in a rAF loop) and the 3D background layer (which reads it each frame). Kept
 * ref-like on purpose — no React state, so per-frame writes never re-render.
 */
export const stageSync = {
  /** Scroll position within the scene, in scene px. */
  scroll: 0,
  /** Smoothed pointer offset from centre, -0.5..0.5. */
  px: 0,
  py: 0,
  /** Orbit→panels flight progress, 0..1. */
  flight: 0,
  /** Reservation impulse, 0..1 — pushes the 3D objects during booking/cancel. */
  wave: 0,
};

export function resetStageSync(): void {
  stageSync.scroll = 0;
  stageSync.px = 0;
  stageSync.py = 0;
  stageSync.flight = 0;
  stageSync.wave = 0;
}
