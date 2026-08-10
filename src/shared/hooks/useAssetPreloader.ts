import { useEffect, useState } from 'react';

interface PreloadArgs {
  /** Image URLs to fully decode before revealing (e.g. wish photos). */
  images: string[];
  /** Static asset URLs to fetch into cache (e.g. GLB models). */
  models: string[];
  /** Only begin once upstream data (the wishes query) has resolved. */
  enabled: boolean;
}

interface PreloadState {
  /** 0..1 across images + models + fonts. */
  progress: number;
  /** True once everything is loaded (or the hard cap elapsed). */
  ready: boolean;
}

/** Hard cap so a single hung asset never traps the user on the loader. */
const MAX_WAIT = 9000;
/** Keep the loader up at least this long so it doesn't flash on fast loads. */
const MIN_SHOW = 650;

/**
 * Preload every asset the first screen needs — wish images, 3D models and web
 * fonts — reporting aggregate progress so the loading screen can wait until the
 * site is genuinely ready before letting the user interact.
 */
export function useAssetPreloader({ images, models, enabled }: PreloadArgs): PreloadState {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  // Stable string keys so the effect only re-runs when the URL sets change.
  const imageKey = images.join('|');
  const modelKey = models.join('|');

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let cancelled = false;
    const start = performance.now();
    const total = images.length + models.length + 1; // +1 for fonts
    let done = 0;

    const finish = () => {
      if (cancelled) {
        return;
      }
      const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
      window.setTimeout(() => {
        if (!cancelled) {
          setProgress(1);
          setReady(true);
        }
      }, wait);
    };

    const bump = () => {
      done += 1;
      if (cancelled) {
        return;
      }
      setProgress(Math.min(0.99, done / total));
      if (done >= total) {
        finish();
      }
    };

    for (const src of images) {
      const img = new Image();
      img.addEventListener('load', bump, { once: true });
      img.addEventListener('error', bump, { once: true });
      img.src = src;
    }
    for (const url of models) {
      fetch(url).then(bump).catch(bump);
    }
    Promise.resolve(document.fonts.ready).then(bump).catch(bump);

    const cap = window.setTimeout(() => {
      if (!cancelled) {
        setProgress(1);
        setReady(true);
      }
    }, MAX_WAIT);

    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [enabled, imageKey, modelKey, images, models]);

  return { progress, ready };
}
