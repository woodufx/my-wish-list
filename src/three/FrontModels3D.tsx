import { Suspense, lazy } from 'react';
import { hasWebGL, useCapabilityTier } from '@/shared/hooks/useCapabilityTier';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { MOBILE_MAX_WIDTH } from '@/shared/config/motion';
import styles from './FrontModels3D.module.css';

const FrontScene = lazy(() => import('./FrontScene'));

/**
 * The front 3D depth plane, layered OVER the cards (only on the orbit screen).
 * Rendered whenever motion is allowed and WebGL exists (a smaller model set on
 * phones); skipped under reduced-motion / no-WebGL.
 */
export function FrontModels3D() {
  const tier = useCapabilityTier();
  const mobile = useMediaQuery(`(max-width: ${MOBILE_MAX_WIDTH}px)`);

  if (tier === 'static' || !hasWebGL()) {
    return null;
  }

  return (
    <div className={styles.host} aria-hidden="true">
      <Suspense fallback={null}>
        <FrontScene mobile={mobile} />
      </Suspense>
    </div>
  );
}
