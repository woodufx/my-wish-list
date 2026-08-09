import type { WishPublic } from '@/entities/wish';
import type { Wishlist } from '@/entities/wishlist';
import { OrbitStage } from '@/features/orbit-gallery';
import { useScrollFlight } from '@/features/scroll-flight';
import { Hero } from './Hero';
import { PanelsView } from './PanelsView';
import styles from './wishlist.module.css';

interface OrbitFlightProps {
  wishes: WishPublic[];
  wishlist?: Wishlist;
  booked: number;
  pendingId?: string;
  onOpen: (wish: WishPublic) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

/**
 * The first screen: the hero overlaid on a rotating orbit of cards that fly apart
 * on scroll (pinned, scrubbed) and land as wide panels below.
 */
export function OrbitFlight({
  wishes,
  wishlist,
  booked,
  pendingId,
  onOpen,
  onToggleReservation,
}: OrbitFlightProps) {
  const { sceneRef, progressRef } = useScrollFlight();

  return (
    <>
      <div ref={sceneRef} className={styles.orbitScene}>
        <div className={styles.heroOverlay}>
          <Hero wishlist={wishlist} total={wishes.length} booked={booked} />
        </div>
        <div className={styles.orbitHolder}>
          <OrbitStage
            wishes={wishes}
            progressRef={progressRef}
            pendingId={pendingId}
            onOpen={onOpen}
            onToggleReservation={onToggleReservation}
          />
        </div>
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
