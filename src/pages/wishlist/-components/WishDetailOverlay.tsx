import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { formatPrice, priorityLabel, type WishPublic } from '@/entities/wish';
import { Button } from '@/shared/ui';
import styles from './wishlist.module.css';

interface WishDetailOverlayProps {
  wish: WishPublic;
  pending?: boolean;
  /** Screen rect of the card that was opened — the panel grows out of it. */
  originRect?: DOMRect | null;
  onClose: () => void;
  onToggleReservation: (wish: WishPublic) => void;
}

const STATUS_TEXT: Record<WishPublic['reservationStatus'], string> = {
  free: 'свободно',
  taken_by_other: 'кто-то уже дарит',
  taken_by_me: 'забронировано вами',
};

const OPEN_EASE = [0.22, 1, 0.36, 1] as const;
const CLOSE_EASE = [0.64, 0, 0.78, 0] as const;

export function WishDetailOverlay({
  wish,
  pending,
  originRect,
  onClose,
  onToggleReservation,
}: WishDetailOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  // grow the panel out of the clicked card (a manual FLIP), fading the backdrop in
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const detail = detailRef.current;
    if (!overlay || !detail) {
      return;
    }
    animate(overlay, { opacity: [0, 1] }, { duration: 0.4, ease: 'easeOut' });
    const box = detail.getBoundingClientRect();
    if (originRect && box.width > 0 && box.height > 0) {
      // start exactly on the card footprint (both axes), then stretch each axis
      // independently to full size — as if the card itself unfolds.
      const sx = Math.max(0.02, originRect.width / box.width);
      const sy = Math.max(0.02, originRect.height / box.height);
      const dx = originRect.left + originRect.width / 2 - (box.left + box.width / 2);
      const dy = originRect.top + originRect.height / 2 - (box.top + box.height / 2);
      animate(
        detail,
        { x: [dx, 0], y: [dy, 0], scaleX: [sx, 1], scaleY: [sy, 1], opacity: [0.55, 1] },
        { duration: 0.56, ease: OPEN_EASE },
      );
    } else {
      animate(detail, { scale: [0.92, 1], opacity: [0, 1] }, { duration: 0.42, ease: 'easeOut' });
    }
  }, [originRect]);

  const close = () => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    const overlay = overlayRef.current;
    const detail = detailRef.current;
    if (!overlay || !detail) {
      onClose();
      return;
    }
    animate(overlay, { opacity: 0 }, { duration: 0.34, ease: 'easeIn' });
    const box = detail.getBoundingClientRect();
    if (originRect && box.width > 0 && box.height > 0) {
      // fold back into the card footprint — the reverse of the open unfold
      const sx = Math.max(0.02, originRect.width / box.width);
      const sy = Math.max(0.02, originRect.height / box.height);
      const dx = originRect.left + originRect.width / 2 - (box.left + box.width / 2);
      const dy = originRect.top + originRect.height / 2 - (box.top + box.height / 2);
      animate(
        detail,
        { x: dx, y: dy, scaleX: sx, scaleY: sy, opacity: 0.4 },
        { duration: 0.34, ease: CLOSE_EASE, onComplete: onClose },
      );
    } else {
      animate(
        detail,
        { scale: 0.94, opacity: 0 },
        { duration: 0.26, ease: 'easeIn', onComplete: onClose },
      );
    }
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const isMine = wish.reservationStatus === 'taken_by_me';
  const isOther = wish.reservationStatus === 'taken_by_other';

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-name"
    >
      <button
        type="button"
        className={styles.overlayBackdrop}
        aria-label="Закрыть"
        onClick={close}
      />
      <div ref={detailRef} className={styles.detail}>
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
            <Button variant="secondary" onClick={close}>
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
