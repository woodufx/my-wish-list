import { useState, type ReactNode } from 'react';
import { usePublicWishes, type WishPublic } from '@/entities/wish';
import { useWishlist } from '@/entities/wishlist';
import { useCancelReservation, useReserveWish } from '@/features/reserve-wish';
import { useViewMode, ViewModeSwitch } from '@/features/view-mode-switch';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { Button, EmptyState, LiquidBackdrop, Skeleton, TopBar } from '@/shared/ui';
import { ListView } from './ListView';
import { PanelsView } from './PanelsView';
import { OrbitFlight } from './OrbitFlight';
import { WishDetailOverlay } from './WishDetailOverlay';
import styles from './wishlist.module.css';

export function PublicWishlist({ slug }: { slug: string }) {
  const wishlistQuery = useWishlist(slug);
  const wishesQuery = usePublicWishes(slug);
  const [mode, setMode] = useViewMode();
  const [openId, setOpenId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const reserve = useReserveWish(slug);
  const cancel = useCancelReservation(slug);
  const pendingId = reserve.isPending
    ? reserve.variables
    : cancel.isPending
      ? cancel.variables
      : undefined;

  const toggleReservation = (wish: WishPublic) => {
    if (wish.reservationStatus === 'free') {
      reserve.mutate(wish.id);
    } else if (wish.reservationStatus === 'taken_by_me') {
      cancel.mutate(wish.id);
    }
  };

  if (wishlistQuery.isError) {
    return (
      <Shell>
        <EmptyState
          tag="404"
          title="СПИСКА НЕТ"
          text="Возможно, ссылка устарела или список удалили. Проверьте адрес."
        />
      </Shell>
    );
  }

  const wishlist = wishlistQuery.data;
  const wishes = wishesQuery.data ?? [];
  const bookedCount = wishes.filter((wish) => wish.reservationStatus !== 'free').length;
  const openWish = wishes.find((wish) => wish.id === openId) ?? null;

  return (
    <Shell mode={mode} onModeChange={setMode}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          СПИСОК
          <br />
          ЖЕЛАНИЙ
        </h1>
        {wishlist && (
          <>
            <p className={styles.heroNote}>{wishlist.note ?? `Список ${wishlist.ownerName}.`}</p>
            <p className={`eyebrow ${styles.heroMeta}`}>
              {wishes.length} желаний · {bookedCount} забронированы
            </p>
          </>
        )}
      </section>

      {wishesQuery.isPending ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} style={{ width: 236, height: 340, borderRadius: 26 }} />
          ))}
        </div>
      ) : wishes.length === 0 ? (
        <EmptyState
          tag="список гостя"
          title="ПОКА ПУСТО"
          text="Владелец ещё не добавил ни одного желания. Загляните чуть позже."
        />
      ) : mode === 'list' ? (
        <ListView
          wishes={wishes}
          pendingId={pendingId}
          onOpen={(wish) => {
            setOpenId(wish.id);
          }}
          onToggleReservation={toggleReservation}
        />
      ) : reducedMotion ? (
        <PanelsView
          wishes={wishes}
          pendingId={pendingId}
          onOpen={(wish) => {
            setOpenId(wish.id);
          }}
          onToggleReservation={toggleReservation}
        />
      ) : (
        <OrbitFlight
          wishes={wishes}
          pendingId={pendingId}
          onOpen={(wish) => {
            setOpenId(wish.id);
          }}
          onToggleReservation={toggleReservation}
        />
      )}

      {openWish && (
        <WishDetailOverlay
          wish={openWish}
          pending={pendingId === openWish.id}
          onClose={() => {
            setOpenId(null);
          }}
          onToggleReservation={toggleReservation}
        />
      )}
    </Shell>
  );
}

interface ShellProps {
  children: ReactNode;
  mode?: 'orbit' | 'list';
  onModeChange?: (mode: 'orbit' | 'list') => void;
}

function Shell({ children, mode, onModeChange }: ShellProps) {
  return (
    <div className={styles.screen}>
      <LiquidBackdrop />
      <TopBar>
        {mode && onModeChange && <ViewModeSwitch mode={mode} onChange={onModeChange} />}
        <Button variant="ghost" size="sm">
          Поделиться
        </Button>
      </TopBar>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
