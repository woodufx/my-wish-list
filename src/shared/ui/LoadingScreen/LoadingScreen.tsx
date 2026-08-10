import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  /** 0..1 load progress driving the bar. */
  progress: number;
  /** When true, the loader dissolves and then unmounts. */
  done: boolean;
}

/**
 * The intro loader shown until every first-screen asset is ready. Mirrors the
 * design: grain + glow over a centred brand mark, a progress bar and a status
 * line, dissolving into blur once loading completes.
 */
export function LoadingScreen({ progress, done }: LoadingScreenProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!done) {
      return undefined;
    }
    const t = window.setTimeout(() => {
      setHidden(true);
    }, 900);
    return () => {
      window.clearTimeout(t);
    };
  }, [done]);

  if (hidden) {
    return null;
  }

  const width = Math.max(10, Math.min(100, progress * 100));

  return (
    <div className={cn(styles.loader, done && styles.out)} aria-hidden={done} role="status">
      <div className={styles.grain} />
      <div className={styles.glow} />
      <div className={styles.col}>
        <div className={styles.brand}>
          <span className={styles.mark} />
          <span className={styles.word}>хочу</span>
        </div>
        <div className={styles.track}>
          <div className={styles.bar} style={{ width: `${width.toFixed(1)}%` }} />
        </div>
        <div className={styles.label}>собираем список</div>
      </div>
    </div>
  );
}
