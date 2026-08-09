import type { WishPublic } from '@/entities/wish';
import { OrbitStage } from '@/features/orbit-gallery';
import { useScrollFlight } from '@/features/scroll-flight';
import { PanelsView } from './PanelsView';
import styles from './wishlist.module.css';

interface OrbitFlightProps {
  wishes: WishPublic[];
  pendingId?: string;
  onOpen: (wish: WishPublic) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

/**
 * The first screen: a rotating orbit of cards that fly apart on scroll (pinned,
 * scrubbed) and land as wide panels below.
 */
export function OrbitFlight({ wishes, pendingId, onOpen, onToggleReservation }: OrbitFlightProps) {
  const { sceneRef, progressRef } = useScrollFlight();

  return (
    <>
      <div ref={sceneRef} className={styles.orbitScene}>
        <OrbitStage
          wishes={wishes}
          progressRef={progressRef}
          pendingId={pendingId}
          onOpen={onOpen}
          onToggleReservation={onToggleReservation}
        />
        <span className={styles.scrollHint}>листайте — список соберётся в панели</span>
      </div>
      <div className={styles.panelsAfter}>
        <PanelsView
          wishes={wishes}
          pendingId={pendingId}
          onOpen={onOpen}
          onToggleReservation={onToggleReservation}
        />
      </div>
    </>
  );
}
