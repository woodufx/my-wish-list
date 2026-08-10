import { formatPrice, priorityLabel, type WishPublic } from '@/entities/wish';
import { cn } from '@/shared/lib/cn';
import styles from './MorphCard.module.css';

interface MorphCardProps {
  wish: WishPublic;
  onOpen: () => void;
  onToggleReservation: () => void;
}

/**
 * A single glass card with two faces — portrait (`data-c`) and wide (`data-w`).
 * The orbit-flight scene resizes the shell and cross-fades the faces to morph an
 * orbit card into a list panel.
 */
export function MorphCard({ wish, onOpen, onToggleReservation }: MorphCardProps) {
  const isOther = wish.reservationStatus === 'taken_by_other';
  const isMine = wish.reservationStatus === 'taken_by_me';
  const price = formatPrice(wish.price, wish.currency);
  const priority = priorityLabel(wish.priority);

  return (
    <div className={cn(styles.shell, isMine && styles.mine)}>
      <div className={styles.rim} />

      {isMine && <span className={styles.mineTag}>Забронировано вами</span>}

      {/* portrait face */}
      <div className={styles.c} data-c="">
        <div className={styles.shot}>
          {wish.imageUrl && <img src={wish.imageUrl} alt="" />}
          <div className={styles.shotScrim} />
          <span className={styles.shotLabel}>фото товара</span>
        </div>
        <div className={styles.cBody}>
          <span className={styles.eyebrowAmber}>{priority}</span>
          <h3 className={styles.name}>{wish.title}</h3>
          {wish.note && <p className={styles.note}>{wish.note}</p>}
          <div className={styles.cFooter}>
            <span className={styles.price}>{price}</span>
            {!isOther && (
              <button
                type="button"
                className={styles.action}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleReservation();
                }}
              >
                {isMine ? 'Снять' : 'Забронировать'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* wide face */}
      <div className={styles.w} data-w="">
        <div className={styles.shot}>
          {wish.imageUrl && <img src={wish.imageUrl} alt="" />}
          <div className={styles.shotScrim} />
          <span className={styles.shotLabel}>фото товара</span>
        </div>
        <div className={styles.wBody}>
          <div className={styles.wEyebrow}>
            <span className={styles.eyebrowAmber}>{priority}</span>
            <span className={styles.rule} />
          </div>
          <h3 className={styles.name}>{wish.title}</h3>
          {wish.note && <p className={styles.note}>{wish.note}</p>}
          <div className={styles.wFooter}>
            <span className={styles.price}>{price}</span>
            {!isOther && (
              <button
                type="button"
                className={styles.action}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleReservation();
                }}
              >
                {isMine ? 'Снять бронь' : 'Забронировать'}
              </button>
            )}
            {isMine && <span className={styles.mineLabel}>Забронировано вами</span>}
          </div>
        </div>
      </div>

      {/* back face — shown while the card spins during booking */}
      <div className={styles.back} data-back="">
        <div className={styles.backHatch} />
        <div className={styles.backGlow} />
        <div className={styles.backLogo}>
          <div className={styles.backMark} />
          <span className={styles.backWord}>хочу</span>
        </div>
      </div>

      {isOther && (
        <div className={styles.otherOverlay}>
          <span className={styles.otherTag}>Кто-то уже дарит</span>
        </div>
      )}

      {/* open affordance behind the buttons */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Открыть «${wish.title}»`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 26,
        }}
      />
    </div>
  );
}
