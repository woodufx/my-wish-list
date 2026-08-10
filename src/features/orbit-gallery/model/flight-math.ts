/**
 * Math for the reservation fly-out, ported from the design's orb-stage:
 * an asymmetric spin (burst out, slow but non-zero mid-flight, eased to a stop)
 * and a proportion swap that only happens while the card is near edge-on.
 */

export function outCubic(p: number): number {
  return 1 - (1 - p) ** 3;
}

export function inOut(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
}

function smooth(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

/** Cumulative, normalized angular-position lookup table for the spin. */
export function spinCurve(): number[] {
  const N = 240;
  const cum: number[] = [0];
  for (let i = 0; i < N; i++) {
    const p = (i + 0.5) / N;
    // gentler than the original: smaller burst, softer decay, so it isn't abrupt
    const v = (1 + 0.4 * Math.cos(2 * Math.PI * p)) * (1 - p ** 2.2) + 0.1;
    cum.push((cum[i] ?? 0) + v);
  }
  const tot = cum[N] ?? 1;
  return cum.map((c) => c / tot);
}

export function curveAt(curve: number[], p: number): number {
  const n = curve.length - 1;
  const x = Math.max(0, Math.min(1, p)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const a = curve[i] ?? 0;
  const b = curve[i + 1] ?? a;
  return a + (b - a) * (x - i);
}

/**
 * Proportions are a single monotone function of accumulated spin angle: they rise
 * across the first edge-on pass (~90°) and fall across the last one before landing.
 */
export function sizeFromSpin(angle: number, end: number): number {
  const up = smooth((angle - 62) / 56);
  const down = smooth((angle - (end - 118)) / 56);
  return Math.max(0, up - down);
}
