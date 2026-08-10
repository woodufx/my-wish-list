import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePublicWishes, type WishPublic } from '@/entities/wish';
import { useWishlist } from '@/entities/wishlist';
import { useCancelReservation, useReserveWish } from '@/features/reserve-wish';
import { useViewMode, ViewModeSwitch, type ViewMode } from '@/features/view-mode-switch';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { useAssetPreloader } from '@/shared/hooks/useAssetPreloader';
import {
  Button,
  EmptyState,
  GrainOverlay,
  LiquidBackdrop,
  LoadingScreen,
  ScreenVeil,
  Skeleton,
  TopBar,
} from '@/shared/ui';
import { OrbitFlightScene } from '@/features/orbit-gallery';
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
  const reducedMotion = usePrefersReducedMotion();

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

  const openDetail = (wish: WishPublic, rect?: DOMRect | null) => {
    setOpenRect(rect ?? null);
    setOpenId(wish.id);
  };

  return (
    <Shell mode={mode} onModeChange={changeMode} switching={switching}>
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
      ) : reducedMotion ? (
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

interface ShellProps {
  children: ReactNode;
  mode?: ViewMode;
  onModeChange?: (mode: ViewMode) => void;
  switching?: boolean;
}

function Shell({ children, mode, onModeChange, switching = false }: ShellProps) {
  return (
    <div className={styles.screen}>
      <LiquidBackdrop />
      <TopBar>
        {mode && onModeChange && <ViewModeSwitch mode={mode} onChange={onModeChange} />}
        <Button variant="ghost" size="sm">
          Поделиться
        </Button>
      </TopBar>
      {children}
      <ScreenVeil show={switching} />
      <GrainOverlay />
    </div>
  );
}
