import { cn } from '@/shared/lib/cn';
import styles from './ScreenVeil.module.css';

interface ScreenVeilProps {
  /** When true the veil covers the screen and blocks interaction. */
  show: boolean;
}

/**
 * A short dark loading veil shown while a heavy view (the 3D orbit) remounts on
 * a tab switch, so the swap reads as a load rather than a jank.
 */
export function ScreenVeil({ show }: ScreenVeilProps) {
  return (
    <div className={cn(styles.veil, show && styles.on)} aria-hidden={!show} role="presentation">
      <div className={styles.grain} />
      <div className={styles.brand}>
        <span className={styles.mark} />
        <span className={styles.word}>хочу</span>
      </div>
    </div>
  );
}
