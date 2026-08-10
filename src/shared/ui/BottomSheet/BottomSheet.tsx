import { useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible label / eyebrow for the sheet. */
  title?: string;
  children: ReactNode;
}

/**
 * A bottom sheet for mobile: slides up over a dimmed backdrop with a drag
 * handle, closes on backdrop tap, the handle, or Escape. Always mounted so the
 * slide transition plays both ways.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={cn(styles.root, open && styles.open)} aria-hidden={!open}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Закрыть"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className={styles.handle} aria-label="Закрыть" onClick={onClose}>
          <span />
        </button>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
