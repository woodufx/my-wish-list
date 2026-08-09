import { WishCard, type WishPublic } from '@/entities/wish';
import styles from './wishlist.module.css';

interface PanelsViewProps {
  wishes: WishPublic[];
  pendingId?: string;
  onOpen: (wish: WishPublic) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

/** The wide-panel layout the orbit flies into (static in stage 3). */
export function PanelsView({ wishes, pendingId, onOpen, onToggleReservation }: PanelsViewProps) {
  return (
    <div className={styles.panels}>
      {wishes.map((wish) => (
        <WishCard
          key={wish.id}
          wish={wish}
          variant="panel"
          pending={pendingId === wish.id}
          onOpen={() => {
            onOpen(wish);
          }}
          onToggleReservation={() => {
            onToggleReservation(wish);
          }}
        />
      ))}
    </div>
  );
}
