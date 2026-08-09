import type { ReactNode } from 'react';
import { Logo } from './Logo';
import styles from './TopBar.module.css';

/** Fixed-position top bar: brand mark on the left, page-specific content right. */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className={styles.bar}>
      <Logo />
      {children && <div className={styles.right}>{children}</div>}
    </header>
  );
}
