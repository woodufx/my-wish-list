import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { PRIORITY_ORDER, usePublicWishes, type WishPublic } from '@/entities/wish';
import { useWishlist } from '@/entities/wishlist';
import { useCancelReservation, useReserveWish } from '@/features/reserve-wish';
import { useViewMode, ViewModeSwitch, type ViewMode } from '@/features/view-mode-switch';
import { useCapabilityTier } from '@/shared/hooks/useCapabilityTier';
import { useAssetPreloader } from '@/shared/hooks/useAssetPreloader';
import {
  EmptyState,
  GrainOverlay,
  LiquidBackdrop,
  LoadingScreen,
  ScreenVeil,
  Skeleton,
  TopBar,
} from '@/shared/ui';
import { OrbitFlightScene } from '@/features/orbit-gallery';
import { toast } from '@/shared/lib/toast';
import { Hero } from './Hero';
import { ListView } from './ListView';
import { PanelsView } from './PanelsView';
import { WishDetailOverlay } from './WishDetailOverlay';
import styles from './wishlist.module.css';

const MODEL_URLS = [
  '/models/heart-silver.glb',
  '/models/tag-silver.glb',
  '/models/blob-silver.glb',
  '/models/torus-silver.glb',
  '/models/knot-silver.glb',
];

export function PublicWishlist({ slug }: { slug: string }) {
  const wishlistQuery = useWishlist(slug);
  const wishesQuery = usePublicWishes(slug);
  const [mode, setMode] = useViewMode();
  const [openId, setOpenId] = useState<string | null>(null);
  const [openRect, setOpenRect] = useState<DOMRect | null>(null);
  const tier = useCapabilityTier();
  const staticView = tier === 'static';

  // Tab switches remount the heavy 3D orbit, which janks — cover the swap with a
  // brief loading veil: fade in, switch behind it, then reveal.
  const [switching, setSwitching] = useState(false);
  const switchTimers = useRef<number[]>([]);
  const changeMode = useCallback(
    (next: ViewMode) => {
      if (next === mode || switching) {
        return;
      }
      setSwitching(true);
      switchTimers.current.forEach(clearTimeout);
      switchTimers.current = [
        window.setTimeout(() => {
          setMode(next);
        }, 320),
        window.setTimeout(() => {
          setSwitching(false);
        }, 820),
      ];
    },
    [mode, switching, setMode],
  );

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

  // Preload every first-screen asset (photos, 3D models, fonts) and hold the
  // loader — and thus interaction — until it's all ready.
  const imageUrls = useMemo(
    () =>
      (wishesQuery.data ?? [])
        .map((wish) => wish.imageUrl)
        .filter((url): url is string => Boolean(url)),
    [wishesQuery.data],
  );
  const assetsEnabled = !wishlistQuery.isPending && !wishesQuery.isPending;
  const { progress: loadProgress, ready: revealed } = useAssetPreloader({
    images: imageUrls,
    models: MODEL_URLS,
    enabled: assetsEnabled,
  });

  if (wishlistQuery.isError) {
    return (
      <Shell slug={slug}>
        <EmptyState
          tag="404"
          title="СПИСКА НЕТ"
          text="Возможно, ссылка устарела или список удалили. Проверьте адрес."
        />
      </Shell>
    );
  }

  const wishlist = wishlistQuery.data;
  // Order strongest-wish-first (dream → want_badly → would_be_nice) so the orbit
  // lands the list top-down by priority. sort() is stable, so same-priority items
  // keep their server order. The plain ListView re-sorts under its own controls.
  const wishes = (wishesQuery.data ?? []).toSorted(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
  const bookedCount = wishes.filter((wish) => wish.reservationStatus !== 'free').length;
  const openWish = wishes.find((wish) => wish.id === openId) ?? null;

  const openDetail = (wish: WishPublic, rect?: DOMRect | null) => {
    setOpenRect(rect ?? null);
    setOpenId(wish.id);
  };

  return (
    <Shell slug={slug} mode={mode} onModeChange={changeMode} switching={switching}>
      {wishesQuery.isPending ? (
        <div className={styles.content}>
          <Hero wishlist={wishlist} total={0} booked={0} />
          <div className={styles.grid}>
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} style={{ width: 236, height: 340, borderRadius: 26 }} />
            ))}
          </div>
        </div>
      ) : wishes.length === 0 ? (
        <div className={styles.content}>
          <Hero wishlist={wishlist} total={0} booked={0} />
          <EmptyState
            tag="список гостя"
            title="ПОКА ПУСТО"
            text="Владелец ещё не добавил ни одного желания. Загляните чуть позже."
          />
        </div>
      ) : mode === 'list' ? (
        <div className={styles.content}>
          <Hero
            wishlist={wishlist}
            total={wishes.length}
            booked={bookedCount}
            revealed={revealed}
          />
          <ListView
            wishes={wishes}
            pendingId={pendingId}
            onOpen={openDetail}
            onToggleReservation={toggleReservation}
          />
        </div>
      ) : staticView ? (
        <div className={styles.content}>
          <Hero
            wishlist={wishlist}
            total={wishes.length}
            booked={bookedCount}
            revealed={revealed}
          />
          <PanelsView
            wishes={wishes}
            pendingId={pendingId}
            onOpen={openDetail}
            onToggleReservation={toggleReservation}
          />
        </div>
      ) : (
        <OrbitFlightScene
          wishes={wishes}
          wishlist={wishlist}
          booked={bookedCount}
          pendingId={pendingId}
          revealed={revealed}
          onOpen={openDetail}
          onToggleReservation={toggleReservation}
        />
      )}

      {openWish && (
        <WishDetailOverlay
          wish={openWish}
          pending={pendingId === openWish.id}
          originRect={openRect}
          onClose={() => {
            setOpenId(null);
            setOpenRect(null);
          }}
          onToggleReservation={toggleReservation}
        />
      )}

      <LoadingScreen progress={loadProgress} done={revealed} />
    </Shell>
  );
}

function BookmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

interface ShellProps {
  children: ReactNode;
  slug: string;
  mode?: ViewMode;
  onModeChange?: (mode: ViewMode) => void;
  switching?: boolean;
}

function Shell({ children, slug, mode, onModeChange, switching = false }: ShellProps) {
  const onShare = () => {
    const url = `${window.location.origin}/wishlist/${slug}`;
    // Native share sheet on mobile; copy to clipboard with a toast elsewhere.
    if (typeof navigator.share === 'function') {
      navigator.share({ title: 'Список желаний', url }).catch(() => {
        // user dismissed the share sheet — nothing to do
      });
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Ссылка на список скопирована'))
      .catch(() => toast.error('Не удалось скопировать ссылку'));
  };

  return (
    <div className={styles.screen}>
      <LiquidBackdrop />
      <TopBar>
        {mode && onModeChange && <ViewModeSwitch mode={mode} onChange={onModeChange} />}
        <Link to="/my-reservations" className={styles.headerAction} aria-label="Мои брони">
          <BookmarkIcon />
          <span className={styles.headerActionLabel}>Мои брони</span>
        </Link>
        <button
          type="button"
          className={styles.headerAction}
          onClick={onShare}
          aria-label="Поделиться списком"
        >
          <ShareIcon />
          <span className={styles.headerActionLabel}>Поделиться</span>
        </button>
      </TopBar>
      {children}
      <ScreenVeil show={switching} />
      <GrainOverlay />
    </div>
  );
}
