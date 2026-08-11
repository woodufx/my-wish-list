import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { animate } from 'motion/react';
import { formatPrice, priorityLabel, type WishPublic } from '@/entities/wish';
import { Button } from '@/shared/ui';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { cn } from '@/shared/lib/cn';
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

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Tween the detail's REAL box (left/top/width/height) between two viewport rects
// by interpolating a 0..1 progress and writing the fixed-position styles each
// frame, so the container genuinely resizes and its content reflows.
function tweenBox(
  detail: HTMLElement,
  from: Rect,
  to: Rect,
  fromOpacity: number,
  toOpacity: number,
  ease: readonly [number, number, number, number],
  duration: number,
  onDone?: () => void,
) {
  detail.style.position = 'fixed';
  detail.style.margin = '0';
  return animate(0, 1, {
    duration,
    ease: [...ease],
    onUpdate: (p) => {
      detail.style.left = `${from.left + (to.left - from.left) * p}px`;
      detail.style.top = `${from.top + (to.top - from.top) * p}px`;
      detail.style.width = `${from.width + (to.width - from.width) * p}px`;
      detail.style.height = `${from.height + (to.height - from.height) * p}px`;
      detail.style.opacity = `${fromOpacity + (toOpacity - fromOpacity) * p}`;
    },
    onComplete: onDone,
  });
}

function clearBox(detail: HTMLElement) {
  detail.style.position = '';
  detail.style.margin = '';
  detail.style.left = '';
  detail.style.top = '';
  detail.style.width = '';
  detail.style.height = '';
  detail.style.opacity = '';
}

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
  const isMobile = useMediaQuery('(max-width: 680px)');

  // Desktop: grow the detail's real box out of the card. Mobile: slide a
  // full-screen sheet up from the bottom.
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const detail = detailRef.current;
    if (!overlay || !detail) {
      return;
    }
    animate(overlay, { opacity: [0, 1] }, { duration: 0.4, ease: 'easeOut' });
    if (isMobile) {
      animate(detail, { y: ['100%', '0%'] }, { duration: 0.42, ease: OPEN_EASE });
      return;
    }
    const box = detail.getBoundingClientRect();
    if (originRect && box.width > 0 && box.height > 0) {
      tweenBox(detail, originRect, box, 0.6, 1, OPEN_EASE, 0.5, () => {
        clearBox(detail);
      });
    } else {
      animate(detail, { opacity: [0, 1] }, { duration: 0.36, ease: 'easeOut' });
    }
  }, [originRect, isMobile]);

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
    if (isMobile) {
      animate(detail, { y: '100%' }, { duration: 0.34, ease: CLOSE_EASE, onComplete: onClose });
      return;
    }
    const box = detail.getBoundingClientRect();
    if (originRect && box.width > 0 && box.height > 0) {
      // shrink the real box back into the card footprint — the reverse of open
      tweenBox(detail, box, originRect, 1, 0.35, CLOSE_EASE, 0.34, onClose);
    } else {
      animate(detail, { opacity: 0 }, { duration: 0.26, ease: 'easeIn', onComplete: onClose });
    }
  };

  // Swipe the sheet down to dismiss (mobile).
  const dragRef = useRef({ y0: 0, dy: 0, active: false });
  const onSheetDown = (event: ReactPointerEvent) => {
    if (!isMobile || closingRef.current) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('button, a')) {
      return;
    }
    dragRef.current = { y0: event.clientY, dy: 0, active: true };
    // keep every subsequent pointer event on the sheet so the browser can't
    // hand the gesture to the scroll container behind it
    try {
      detailRef.current?.setPointerCapture?.(event.pointerId);
    } catch {
      // no active pointer with that id (e.g. synthetic events) — safe to ignore
    }
  };
  const onSheetMove = (event: ReactPointerEvent) => {
    const drag = dragRef.current;
    const detail = detailRef.current;
    if (!drag.active || !detail) {
      return;
    }
    const dy = event.clientY - drag.y0;
    drag.dy = dy > 0 ? dy : dy * 0.2;
    detail.style.transform = `translateY(${drag.dy}px)`;
  };
  const onSheetUp = () => {
    const drag = dragRef.current;
    const detail = detailRef.current;
    if (!drag.active || !detail) {
      return;
    }
    drag.active = false;
    if (drag.dy > 120) {
      close();
    } else {
      animate(detail, { transform: 'translateY(0px)' }, { duration: 0.3, ease: OPEN_EASE });
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
      <div
        ref={detailRef}
        className={cn(styles.detail, isMobile && styles.detailMobile)}
        onPointerDown={onSheetDown}
        onPointerMove={onSheetMove}
        onPointerUp={onSheetUp}
        onPointerCancel={onSheetUp}
      >
        {isMobile && <span className={styles.detailHandle} aria-hidden="true" />}
        <div className={styles.detailShot}>
          {wish.imageUrl && <img src={wish.imageUrl} alt="" />}
          <span className={styles.detailShotLabel}>фото товара</span>
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
          {isMobile && <span className={styles.detailSwipeHint}>свайп вниз закрывает</span>}
        </div>
      </div>
    </div>
  );
}
