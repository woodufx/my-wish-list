import { Suspense, lazy } from 'react';
import { useCapabilityTier } from '@/shared/hooks/useCapabilityTier';
import styles from './FrontModels3D.module.css';

const FrontScene = lazy(() => import('./FrontScene'));

/**
 * The front 3D depth plane, layered OVER the cards (only mounted on the orbit
 * screen). Only on the `full` tier — phones/low-power/reduced-motion skip it.
 */
export function FrontModels3D() {
  const tier = useCapabilityTier();

  if (tier !== 'full') {
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
