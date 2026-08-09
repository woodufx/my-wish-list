/** Cheap heuristic: skip the 3D scene on low-power devices or without WebGL. */
export function canRender3D(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 4) < 4 || (nav.deviceMemory ?? 4) < 4) {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
