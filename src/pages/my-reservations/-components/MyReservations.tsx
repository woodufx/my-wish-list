import { Link } from '@tanstack/react-router';
import { formatPrice, priorityLabel } from '@/entities/wish';
import { useMyReservations } from '@/entities/reservation';
import { useReleaseReservation } from '@/features/reserve-wish';
import { Button, EmptyState, LiquidBackdrop, Skeleton, TopBar } from '@/shared/ui';
import { formatDate } from '@/shared/lib/format';
import { DEFAULT_WISHLIST_SLUG } from '@/shared/config/app';
import styles from './MyReservations.module.css';

export function MyReservations() {
  const query = useMyReservations();
  const release = useReleaseReservation();
  const reservations = query.data ?? [];

  return (
    <div className={styles.screen}>
      <LiquidBackdrop />
      <TopBar>
        <Link to="/wishlist/$slug" params={{ slug: DEFAULT_WISHLIST_SLUG }} className={styles.back}>
          ← К списку желаний
        </Link>
      </TopBar>
      <div className={styles.content}>
        <h1 className={styles.title}>МОИ БРОНИ</h1>
        <p className={styles.subtitle}>
          Здесь только то, что забронировали вы. Владелец списка этого не видит — ни сейчас, ни
          после праздника.
        </p>

        {query.isPending ? (
          <div className={styles.list}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} style={{ height: 116, borderRadius: 22 }} />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <EmptyState
            tag="список гостя"
            title="БРОНЕЙ ПОКА НЕТ"
            text="Откройте список желаний и выберите подарок. Бронь можно снять в любой момент."
            action={
              <Link to="/wishlist/$slug" params={{ slug: 'demo' }} className="eyebrow">
                К списку желаний →
              </Link>
            }
          />
        ) : (
          <ul className={styles.list}>
            {reservations.map(({ wish, createdAt }) => (
              <li key={wish.id} className={styles.row}>
                <div className={styles.thumb}>
                  {wish.imageUrl && <img src={wish.imageUrl} alt="" />}
                </div>
                <div className={styles.rowBody}>
                  <span className={`eyebrow ${styles.rowEyebrow}`}>
                    {priorityLabel(wish.priority)}
                  </span>
                  <h2 className={styles.rowName}>{wish.title}</h2>
                  <span className={styles.rowMeta}>Забронировано {formatDate(createdAt)}</span>
                </div>
                <span className={styles.rowPrice}>{formatPrice(wish.price, wish.currency)}</span>
                <Button
                  variant="danger"
                  loading={release.isPending && release.variables === wish.id}
                  onClick={() => {
                    release.mutate(wish.id);
                  }}
                >
                  Снять бронь
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
