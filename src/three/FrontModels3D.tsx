import { Suspense, lazy } from 'react';
import { hasWebGL, useCapabilityTier } from '@/shared/hooks/useCapabilityTier';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { MOBILE_MAX_WIDTH } from '@/shared/config/motion';
import styles from './FrontModels3D.module.css';

const FrontScene = lazy(() => import('./FrontScene'));

/**
 * The front 3D depth plane, layered OVER the cards (only on the orbit screen).
 * Rendered on capable desktops; skipped under reduced-motion / no-WebGL and on
 * phones — a second WebGL context over the cards was too heavy on mobile, so the
 * single background scene carries all the 3D there.
 */
export function FrontModels3D() {
  const tier = useCapabilityTier();
  const mobile = useMediaQuery(`(max-width: ${MOBILE_MAX_WIDTH}px)`);

  if (tier === 'static' || !hasWebGL() || mobile) {
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
