import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { animate } from 'motion/react';
import { formatPrice, priorityLabel, type WishPublic } from '@/entities/wish';
import { Button } from '@/shared/ui';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { lockScroll, unlockScroll } from '@/shared/lib/scroll-lock';
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

  // One transform channel for the mobile sheet (open, drag, close). Mixing a raw
  // style.transform write for the drag with motion's `y` for the animations made
  // close jump back to the top before sliding down — everything writes translateY
  // in px now, so they compose seamlessly.
  const dragRef = useRef({ startY: 0, dy: 0, dragging: false, tracking: false });
  const setSheetY = (y: number) => {
    const detail = detailRef.current;
    if (detail) {
      detail.style.transform = `translate3d(0, ${y}px, 0)`;
    }
  };
  const sheetHeight = () => detailRef.current?.offsetHeight ?? window.innerHeight;
  // Walk from the touch target up to the sheet: if any element is scrolled down
  // from its top (the body, or the description's own scroll box), the gesture
  // belongs to that scroller — not to swipe-close.
  const anyScrolledUp = (from: EventTarget | null): boolean => {
    let node = from instanceof Element ? from : null;
    const sheet = detailRef.current;
    while (node && node !== sheet) {
      if (node instanceof HTMLElement && node.scrollTop > 0) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  };

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
      const h = sheetHeight();
      setSheetY(h);
      animate(h, 0, { duration: 0.42, ease: OPEN_EASE, onUpdate: setSheetY });
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
      // slide out from wherever the drag left it (0 for a button/backdrop close)
      animate(dragRef.current.dy || 0, sheetHeight(), {
        duration: 0.34,
        ease: CLOSE_EASE,
        onUpdate: setSheetY,
        onComplete: onClose,
      });
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

  // Swipe the sheet down to dismiss (mobile). A pull only becomes a drag when no
  // inner scroller (body or the description box) is scrolled down — so long text
  // scrolls normally; a pull from the handle/image always drags.
  const onSheetDown = (event: ReactPointerEvent) => {
    if (!isMobile || closingRef.current) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('button, a')) {
      return;
    }
    dragRef.current = { startY: event.clientY, dy: 0, dragging: false, tracking: true };
  };
  const onSheetMove = (event: ReactPointerEvent) => {
    const drag = dragRef.current;
    const detail = detailRef.current;
    if (!drag.tracking || !detail) {
      return;
    }
    const dy = event.clientY - drag.startY;
    if (!drag.dragging) {
      if (dy > 6 && !anyScrolledUp(event.target)) {
        drag.dragging = true;
        try {
          detail.setPointerCapture?.(event.pointerId);
        } catch {
          // synthetic pointer id — safe to ignore
        }
      } else if (dy < -6 || dy > 6) {
        // upward, or downward mid-scroll → hand the gesture back to the scroller
        drag.tracking = false;
        return;
      } else {
        return;
      }
    }
    drag.dy = dy > 0 ? dy : dy * 0.2;
    setSheetY(drag.dy);
  };
  const onSheetUp = () => {
    const drag = dragRef.current;
    if (!drag.tracking) {
      return;
    }
    const wasDragging = drag.dragging;
    drag.tracking = false;
    drag.dragging = false;
    if (!wasDragging) {
      return;
    }
    if (drag.dy > 120) {
      close();
    } else {
      animate(drag.dy, 0, { duration: 0.3, ease: OPEN_EASE, onUpdate: setSheetY });
      drag.dy = 0;
    }
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  // Freeze the page behind the overlay: a swipe on the sheet must not scroll the
  // list underneath, and iOS must not fire pull-to-refresh.
  useEffect(() => {
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, []);

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
