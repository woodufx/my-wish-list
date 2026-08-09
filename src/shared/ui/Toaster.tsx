import { useEffect, useSyncExternalStore } from 'react';
import { dismissToast, getToasts, subscribeToasts, type Toast } from '@/shared/lib/toast';
import styles from './Toaster.module.css';

const AUTO_DISMISS_MS = 4000;

function useToasts(): readonly Toast[] {
  return useSyncExternalStore(subscribeToasts, getToasts, getToasts);
}

function ToastItem({ toast }: { toast: Toast }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      dismissToast(toast.id);
    }, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [toast.id]);

  return (
    <output className={styles.toast}>
      <span className={`${styles.dot} ${styles[toast.variant]}`} aria-hidden="true" />
      <span className={styles.text}>{toast.message}</span>
    </output>
  );
}

/** Renders the global toast queue. Mounted once, near the app root. */
export function Toaster() {
  const toasts = useToasts();
  return (
    <div className={styles.toaster} aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
