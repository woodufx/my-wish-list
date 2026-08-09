import { useEffect } from 'react';
import { formatPrice, priorityLabel, type WishPublic } from '@/entities/wish';
import { Button } from '@/shared/ui';
import styles from './wishlist.module.css';

interface WishDetailOverlayProps {
  wish: WishPublic;
  pending?: boolean;
  onClose: () => void;
  onToggleReservation: (wish: WishPublic) => void;
}

const STATUS_TEXT: Record<WishPublic['reservationStatus'], string> = {
  free: 'свободно',
  taken_by_other: 'кто-то уже дарит',
  taken_by_me: 'забронировано вами',
};

export function WishDetailOverlay({
  wish,
  pending,
  onClose,
  onToggleReservation,
}: WishDetailOverlayProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const isMine = wish.reservationStatus === 'taken_by_me';
  const isOther = wish.reservationStatus === 'taken_by_other';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="detail-name">
      <div className={styles.detail}>
        <div className={styles.detailShot}>
          {wish.imageUrl && <img src={wish.imageUrl} alt="" />}
        </div>
        <div className={styles.detailBody}>
          <div className={`eyebrow ${styles.detailEyebrow}`}>
            <span>приоритет · {priorityLabel(wish.priority)}</span>
            <span className={styles.detailRule} />
          </div>
          <h2 id="detail-name" className={styles.detailName}>
            {wish.title}
          </h2>
          {wish.note && <p className={styles.detailNote}>{wish.note}</p>}
          <div className={styles.detailPriceRow}>
            <span className={styles.detailPrice}>{formatPrice(wish.price, wish.currency)}</span>
            {wish.url && (
              <a href={wish.url} target="_blank" rel="noreferrer" className="eyebrow">
                ссылка на магазин ↗
              </a>
            )}
          </div>
          <span className={`eyebrow ${styles.detailStatus}`}>
            {STATUS_TEXT[wish.reservationStatus]}
          </span>
          <div className={styles.detailActions}>
            {!isOther && (
              <Button
                variant={isMine ? 'ghost' : 'primary'}
                loading={pending}
                onClick={() => {
                  onToggleReservation(wish);
                }}
              >
                {isMine ? 'Снять бронь' : 'Забронировать'}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
