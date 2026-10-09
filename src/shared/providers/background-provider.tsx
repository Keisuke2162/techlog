'use client';

import * as React from 'react';

export const BACKGROUND_PRESETS = [
  { value: 'paper', label: 'Paper', description: '柔らかいクリーム' },
  { value: 'mist', label: 'Mist', description: '淡いブルーグレー' },
  { value: 'stone', label: 'Stone', description: '中立のウォームグレー' },
  { value: 'sand', label: 'Sand', description: '少し暖かい砂色' },
  { value: 'sage', label: 'Sage', description: 'ごく薄いセージ' },
  { value: 'snow', label: 'Snow', description: '純白（明るめ）' },
] as const;

export type BackgroundPreset = (typeof BACKGROUND_PRESETS)[number]['value'];

export const DEFAULT_BACKGROUND: BackgroundPreset = 'paper';
export const BACKGROUND_STORAGE_KEY = 'techlog-bg';

function isPreset(value: unknown): value is BackgroundPreset {
  return typeof value === 'string' && BACKGROUND_PRESETS.some((p) => p.value === value);
}

/* ----- module-level store (shared across the app) ----- */

let current: BackgroundPreset = DEFAULT_BACKGROUND;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrateFromDom(): void {
  if (hydrated || typeof document === 'undefined') return;
  const v = document.documentElement.getAttribute('data-bg');
  if (isPreset(v)) current = v;
  hydrated = true;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): BackgroundPreset {
  hydrateFromDom();
  return current;
}

function getServerSnapshot(): BackgroundPreset {
  return DEFAULT_BACKGROUND;
}

export function setBackground(next: BackgroundPreset): void {
  current = next;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-bg', next);
    try {
      window.localStorage.setItem(BACKGROUND_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private-mode errors */
    }
  }
  for (const l of listeners) l();
}

export function useBackground(): {
  background: BackgroundPreset;
  setBackground: (value: BackgroundPreset) => void;
} {
  const background = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { background, setBackground };
}

/**
 * Inline script string: pre-apply the stored preset before React hydrates so
 * there is no flash of the default background on load.
 */
export const BACKGROUND_INIT_SCRIPT = `
(function(){try{var v=localStorage.getItem(${JSON.stringify(BACKGROUND_STORAGE_KEY)});
if(!v){v=${JSON.stringify(DEFAULT_BACKGROUND)};}
document.documentElement.setAttribute('data-bg',v);}catch(e){}})();
`.trim();
