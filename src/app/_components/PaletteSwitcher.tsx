'use client';

import { useEffect, useState } from 'react';

const PALETTES = ['ember', 'walnut', 'slate', 'paper', 'tray', 'duo'] as const;
type Palette = (typeof PALETTES)[number];

/**
 * Dev-only: flips the board palette (see the `--board-*` tokens in
 * globals.css) so the options can be compared live. `?palette=` sets the
 * starting one. Remove once a palette is chosen.
 */
export function PaletteSwitcher() {
  const [palette, setPalette] = useState<Palette>(() => {
    if (typeof window === 'undefined') return 'ember';
    const asked = new URLSearchParams(window.location.search).get('palette');
    return PALETTES.includes(asked as Palette) ? (asked as Palette) : 'ember';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (palette === 'ember') delete root.dataset.palette;
    else root.dataset.palette = palette;
    const url = new URL(window.location.href);
    if (palette === 'ember') url.searchParams.delete('palette');
    else url.searchParams.set('palette', palette);
    window.history.replaceState(null, '', url);
  }, [palette]);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex gap-1 rounded-xl bg-black/70 p-1 font-crt text-lg backdrop-blur">
      {PALETTES.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPalette(p)}
          className={`rounded-lg px-2.5 leading-7 ${p === palette ? 'bg-orange text-lacquer' : 'text-ash hover:text-rice'}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
