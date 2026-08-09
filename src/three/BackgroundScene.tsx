import { Suspense, lazy, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import styles from './BackgroundScene.module.css';

// three / R3F / drei land in a separate chunk, loaded only when the scene mounts.
const Scene = lazy(() => import('./Scene'));

/** Cheap heuristic: skip the 3D scene on low-power devices or without WebGL. */
function canRender3D(): boolean {
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

/**
 * The fixed, full-screen 3D backdrop sitting under all content. Not mounted at
 * all under reduced motion or on weak devices — the CSS `LiquidBackdrop`
 * gradients remain as the fallback.
 */
export function BackgroundScene() {
  const reducedMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!reducedMotion && canRender3D());
  }, [reducedMotion]);

  if (!enabled) {
    return null;
  }

  return (
    <div className={styles.host} aria-hidden="true">
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </div>
  );
}
