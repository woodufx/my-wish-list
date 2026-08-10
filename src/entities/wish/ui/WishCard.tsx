import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui';
import { formatPrice, priorityLabel } from '../lib/format';
import { type WishPublic } from '../model/schema';
import styles from './WishCard.module.css';

type Variant = 'portrait' | 'panel';

interface WishCardProps {
  wish: WishPublic;
  variant?: Variant;
  /** Opens the detail view. */
  onOpen?: () => void;
  /** Reserve when free / cancel when taken_by_me. Absent for taken_by_other. */
  onToggleReservation?: () => void;
  pending?: boolean;
}

const STATUS_TEXT: Record<WishPublic['reservationStatus'], string> = {
  free: 'свободно',
  taken_by_other: 'кто-то уже дарит',
  taken_by_me: 'забронировано вами',
};

export function WishCard({
  wish,
  variant = 'portrait',
  onOpen,
  onToggleReservation,
  pending = false,
}: WishCardProps) {
  const isOther = wish.reservationStatus === 'taken_by_other';
  const isMine = wish.reservationStatus === 'taken_by_me';
  const isPanel = variant === 'panel';

  return (
    <article
      className={cn(styles.card, styles[variant], isMine && styles.mine)}
      aria-label={`${wish.title} — ${formatPrice(wish.price, wish.currency)}, ${STATUS_TEXT[wish.reservationStatus]}`}
    >
      {onOpen && (
        <button
          type="button"
          className={styles.openHit}
          onClick={onOpen}
          aria-label={`Открыть «${wish.title}»`}
          data-cursor-label="Открыть"
        />
      )}

      {isMine && <span className={styles.mineTag}>Забронировано вами</span>}

      <div className={styles.inner}>
        <div className={styles.shot}>
          {wish.imageUrl && <img src={wish.imageUrl} alt="" />}
          <div className={styles.shotScrim} />
          <span className={styles.shotLabel}>фото товара</span>
        </div>

        <div className={styles.body}>
          {isPanel ? (
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowAmber}>{priorityLabel(wish.priority)}</span>
              <span className={styles.rule} />
            </div>
          ) : (
            <span className={styles.eyebrowAmber}>{priorityLabel(wish.priority)}</span>
          )}

          <h3 className={styles.name}>{wish.title}</h3>
          {wish.note && <p className={styles.note}>{wish.note}</p>}

          <div className={styles.footer}>
            <span className={styles.price}>{formatPrice(wish.price, wish.currency)}</span>
            {!isOther && onToggleReservation && (
              <Button
                variant={isMine ? 'ghost' : 'secondary'}
                size={isPanel ? 'md' : 'sm'}
                className={styles.action}
                loading={pending}
                onClick={onToggleReservation}
              >
                {isMine ? 'Снять бронь' : 'Забронировать'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isOther && (
        <div className={styles.otherOverlay}>
          <span className={styles.otherTag}>Кто-то уже дарит</span>
        </div>
      )}
    </article>
  );
}
