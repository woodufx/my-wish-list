import { Suspense, lazy } from 'react';
import { hasWebGL, useCapabilityTier } from '@/shared/hooks/useCapabilityTier';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { MOBILE_MAX_WIDTH } from '@/shared/config/motion';
import styles from './BackgroundScene.module.css';

// three / R3F / drei land in a separate chunk, loaded only when the scene mounts.
const Scene = lazy(() => import('./Scene'));

/**
 * The fixed, full-screen 3D backdrop sitting under all content. Mounted on the
 * `full` desktop tier and on phones with WebGL (a smaller centred model set);
 * low-power desktops and reduced-motion fall back to the CSS `LiquidBackdrop`.
 */
export function BackgroundScene() {
  const tier = useCapabilityTier();
  const mobile = useMediaQuery(`(max-width: ${MOBILE_MAX_WIDTH}px)`);

  if (tier === 'static' || !hasWebGL()) {
    return null;
  }
  // lite desktops keep the CSS fallback; only full desktop or phones get the 3D.
  if (tier !== 'full' && !mobile) {
    return null;
  }

  return (
    <div className={styles.host} aria-hidden="true">
      <Suspense fallback={null}>
        <Scene mobile={mobile} />
      </Suspense>
    </div>
  );
}
