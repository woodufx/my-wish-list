import styles from './LiquidBackdrop.module.css';

/** Fixed full-screen gradient backdrop sitting under all content. */
export function LiquidBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.bands}>
        <div className={`${styles.band} ${styles.band1}`} />
        <div className={`${styles.band} ${styles.band2}`} />
        <div className={`${styles.band} ${styles.band3}`} />
      </div>
      <div className={styles.vignette} />
    </div>
  );
}
