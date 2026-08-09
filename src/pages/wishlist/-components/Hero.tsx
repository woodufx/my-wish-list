import type { Wishlist } from '@/entities/wishlist';
import styles from './wishlist.module.css';

interface HeroProps {
  wishlist?: Wishlist;
  total: number;
  booked: number;
}

export function Hero({ wishlist, total, booked }: HeroProps) {
  return (
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>
        СПИСОК
        <br />
        ЖЕЛАНИЙ
      </h1>
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
