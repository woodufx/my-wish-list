import styles from './GrainOverlay.module.css';

/**
 * Fine film grain laid over the whole page (as in the design) — a subtle
 * `overlay`-blended noise that ties the glass and gradients together. Purely
 * decorative and non-interactive.
 */
export function GrainOverlay() {
  return <div className={styles.grain} aria-hidden="true" />;
}
