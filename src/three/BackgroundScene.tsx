import { Suspense, lazy } from 'react';
import { useCapabilityTier } from '@/shared/hooks/useCapabilityTier';
import styles from './BackgroundScene.module.css';

// three / R3F / drei land in a separate chunk, loaded only when the scene mounts.
const Scene = lazy(() => import('./Scene'));

/**
 * The fixed, full-screen 3D backdrop sitting under all content. Mounted only on
 * the `full` tier — phones/low-power/reduced-motion fall back to the CSS
 * `LiquidBackdrop` gradients.
 */
export function BackgroundScene() {
  const tier = useCapabilityTier();

  if (tier !== 'full') {
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
