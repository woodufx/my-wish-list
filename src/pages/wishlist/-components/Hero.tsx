import type { Wishlist } from '@/entities/wishlist';
import { cn } from '@/shared/lib/cn';
import styles from './wishlist.module.css';

interface HeroProps {
  wishlist?: Wishlist;
  total: number;
  booked: number;
  /** Plays the intro reveal once the loader has dissolved. */
  revealed?: boolean;
}

export function Hero({ wishlist, total, booked, revealed }: HeroProps) {
  return (
    <div className={cn(styles.hero, revealed && styles.heroIn)}>
      <div className={styles.heroTitleMask}>
        <h1 className={styles.heroTitle}>
          СПИСОК
          <br />
          ЖЕЛАНИЙ
        </h1>
      </div>
      {wishlist && (
        <>
          <p className={styles.heroNote}>{wishlist.note ?? `Список ${wishlist.ownerName}.`}</p>
          <p className={`eyebrow ${styles.heroMeta}`}>
            {total} желаний · {booked} забронированы
          </p>
        </>
      )}
    </div>
  );
}
