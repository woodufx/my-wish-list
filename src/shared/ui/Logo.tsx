import { Link } from '@tanstack/react-router';
import { DEFAULT_WISHLIST_SLUG } from '@/shared/config/app';
import styles from './Logo.module.css';

/** The "хочу" brand mark — links home (the public wishlist). */
export function Logo() {
  return (
    <Link
      to="/wishlist/$slug"
      params={{ slug: DEFAULT_WISHLIST_SLUG }}
      className={styles.logo}
      aria-label="На главную"
    >
      <span className={styles.mark} aria-hidden="true" />
      <span className={styles.word}>хочу</span>
    </Link>
  );
}
