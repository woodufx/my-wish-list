import { useCallback, useState } from 'react';

export type ViewMode = 'orbit' | 'list';

const STORAGE_KEY = 'wishlist.view-mode';

function read(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'list' ? 'list' : 'orbit';
  } catch {
    return 'orbit';
  }
}

/** View mode with the choice persisted across visits. */
export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>(read);

  const select = useCallback((next: ViewMode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — keep it in memory only
    }
  }, []);

  return [mode, select] as const;
}
