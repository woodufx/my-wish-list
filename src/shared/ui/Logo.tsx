import styles from './Logo.module.css';

/** The "хочу" brand mark. */
export function Logo() {
  return (
    <span className={styles.logo}>
      <span className={styles.mark} aria-hidden="true" />
      <span className={styles.word}>хочу</span>
    </span>
  );
}
