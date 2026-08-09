import { Suspense, lazy, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { canRender3D } from './can-render-3d';
import styles from './FrontModels3D.module.css';

const FrontScene = lazy(() => import('./FrontScene'));

/**
 * The front 3D depth plane, layered OVER the cards (only mounted on the orbit
 * screen). Skipped under reduced motion or on weak devices.
 */
export function FrontModels3D() {
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
        <FrontScene />
      </Suspense>
    </div>
  );
}
