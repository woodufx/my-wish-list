import { useEffect, useRef, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { LoadingScreen } from './LoadingScreen/LoadingScreen';

const isBookings = (path: string) => path.startsWith('/my-reservations');

interface TransitionState {
  id: number;
  progress: number;
  done: boolean;
  label: string;
}

/**
 * Plays the "хочу" loader as a brief veil when navigating INTO the "my bookings"
 * screen and back out of it, so those two transitions feel like a deliberate
 * hand-off (the same intro animation the app opens with) instead of an instant
 * swap. It's a cosmetic overlay — it does not gate the real data.
 */
export function RouteTransitionLoader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const prevRef = useRef(pathname);
  const idRef = useRef(0);
  const [state, setState] = useState<TransitionState | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = pathname;
    // fire only when we cross the boundary into or out of the bookings screen
    if (isBookings(prev) === isBookings(pathname)) {
      return undefined;
    }

    const id = (idRef.current += 1);
    const label = isBookings(pathname) ? 'открываем брони' : 'собираем список';
    const patch = (next: (s: TransitionState) => TransitionState) =>
      setState((s) => (s && s.id === id ? next(s) : s));

    setState({ id, progress: 0.12, done: false, label });
    const timers = [
      window.setTimeout(() => patch((s) => ({ ...s, progress: 0.7 })), 80),
      window.setTimeout(() => patch((s) => ({ ...s, progress: 1, done: true })), 480),
      // clear once the dissolve has finished (LoadingScreen fades for ~0.9s)
      window.setTimeout(() => setState((s) => (s && s.id === id ? null : s)), 1480),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [pathname]);

  if (!state) {
    return null;
  }
  return (
    <LoadingScreen key={state.id} progress={state.progress} done={state.done} label={state.label} />
  );
}
