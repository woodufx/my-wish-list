import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  tag: string;
  title: string;
  text: string;
  action?: ReactNode;
}

export function EmptyState({ tag, title, text, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={`eyebrow ${styles.tag}`}>{tag}</span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{text}</p>
      {action}
    </div>
  );
}
