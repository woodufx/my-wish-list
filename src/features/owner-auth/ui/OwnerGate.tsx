import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, LiquidBackdrop } from '@/shared/ui';
import { useOwnerLogin, useOwnerSession } from '../hooks';
import styles from './OwnerGate.module.css';

/**
 * Guards the owner console: renders its children only once the browser holds a
 * valid owner cookie, otherwise a secret-key login. The admin queries (which the
 * server 401s without the cookie) never mount until the gate opens.
 */
export function OwnerGate({ children }: { children: ReactNode }) {
  const session = useOwnerSession();
  const login = useOwnerLogin();
  const [secret, setSecret] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const showLogin = !session.isPending && !session.data?.authenticated;
  useEffect(() => {
    if (showLogin) {
      inputRef.current?.focus();
    }
  }, [showLogin]);

  if (session.isPending) {
    return (
      <div className={styles.screen}>
        <LiquidBackdrop />
        <span className={styles.hint}>Проверяем доступ…</span>
      </div>
    );
  }

  if (session.data?.authenticated) {
    return children;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (secret.trim()) {
      login.mutate(secret.trim());
    }
  };

  return (
    <div className={styles.screen}>
      <LiquidBackdrop />
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.title}>Вход для владельца</h1>
        <p className={styles.text}>Введите секретный ключ, чтобы управлять своим списком.</p>
        <input
          ref={inputRef}
          type="password"
          className={styles.input}
          value={secret}
          onChange={(event) => {
            setSecret(event.target.value);
          }}
          placeholder="Секретный ключ"
          autoComplete="current-password"
          aria-label="Секретный ключ владельца"
        />
        {login.isError && (
          <span className={styles.error} role="alert">
            Неверный ключ. Попробуйте ещё раз.
          </span>
        )}
        <Button type="submit" variant="primary" loading={login.isPending} disabled={!secret.trim()}>
          Войти
        </Button>
      </form>
    </div>
  );
}
