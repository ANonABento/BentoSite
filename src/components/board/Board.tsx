'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Board as BoardData, BoardCard } from '@/lib/board';
import { AboutCard, ExperienceCard, IntroCard, ProjectCard, ResumeCard, TechCard } from './cards';

type Camera = { x: number; y: number; s: number };

const CAMERA_KEY = 'bentos:camera';
const DOCK_SPACE = 88; // px kept clear at the bottom for the command bar
const DRAG_THRESHOLD = 6;
const FRICTION = 0.94; // velocity kept per 16ms frame
const RUBBER = 0.35; // how far past the edge a drag can stretch, as a ratio

export function Board({ board }: { board: BoardData }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const cam = useRef<Camera>({ x: 0, y: 0, s: 1 });
  const desktop = useRef(false);
  const [overview, setOverview] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------- Filtering ----------

  const needle = query.trim().toLowerCase();
  const filtering = needle !== '' || category !== null;
  const matches = useMemo(() => matchCards(board.cards, query, category), [board.cards, category, query]);
  const projectCount = board.cards.filter((c) => c.kind === 'project').length;

  // ---------- Geometry ----------

  const metrics = useCallback(() => {
    const tray = trayRef.current!;
    const pad = parseFloat(getComputedStyle(tray).paddingLeft);
    const step = (tray.offsetWidth - pad) / board.cols;
    return {
      W: tray.offsetWidth,
      H: tray.offsetHeight,
      pad,
      step,
      vw: window.innerWidth,
      vh: window.innerHeight - DOCK_SPACE,
    };
  }, [board.cols]);

  const rectOf = useCallback(
    (cards: Pick<BoardCard, 'col' | 'row' | 'w' | 'h'>[]) => {
      const { pad, step } = metrics();
      const wall = pad;
      const left = Math.min(...cards.map((c) => c.col));
      const top = Math.min(...cards.map((c) => c.row));
      const right = Math.max(...cards.map((c) => c.col + c.w));
      const bottom = Math.max(...cards.map((c) => c.row + c.h));
      return {
        x: pad + left * step,
        y: pad + top * step,
        w: (right - left) * step - wall,
        h: (bottom - top) * step - wall,
      };
    },
    [metrics],
  );

  /** Where the camera may sit, for a given scale. */
  const bounds = useCallback(
    (s: number) => {
      const { W, H, vw, vh } = metrics();
      const axis = (size: number, view: number) => {
        if (size <= view) {
          const centred = (view - size) / 2;
          return [centred, centred] as const;
        }
        const margin = Math.min(view * 0.25, 220);
        return [view - size - margin, margin] as const;
      };
      return { x: axis(W * s, vw), y: axis(H * s, vh) };
    },
    [metrics],
  );

  const apply = useCallback((c: Camera) => {
    cam.current = c;
    trayRef.current!.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.s})`;
  }, []);

  const clamp = useCallback(
    (c: Camera): Camera => {
      const b = bounds(c.s);
      return { s: c.s, x: Math.min(b.x[1], Math.max(b.x[0], c.x)), y: Math.min(b.y[1], Math.max(b.y[0], c.y)) };
    },
    [bounds],
  );

  const glide = useCallback(
    (to: Camera) => {
      const tray = trayRef.current!;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) {
        tray.classList.add('gliding');
        const done = () => tray.classList.remove('gliding');
        tray.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 700);
      }
      apply(to);
    },
    [apply],
  );

  /** Camera that centres a board-space rect, zoomed out only as far as it needs to fit. */
  const frame = useCallback(
    (r: { x: number; y: number; w: number; h: number }, maxScale = 1): Camera => {
      const { vw, vh } = metrics();
      const s = Math.min(maxScale, (vw - 96) / r.w, (vh - 64) / r.h);
      return clamp({ s, x: vw / 2 - (r.x + r.w / 2) * s, y: vh / 2 - (r.y + r.h / 2) * s });
    },
    [clamp, metrics],
  );

  const keystone = useMemo(() => board.cards.find((c) => c.kind === 'intro')!, [board.cards]);
  const home = useCallback(() => frame(rectOf([keystone]), 1), [frame, rectOf, keystone]);

  const fitAll = useCallback((): Camera => {
    const { W, H, vw, vh } = metrics();
    const s = Math.min(1, (vw - 64) / W, (vh - 48) / H);
    return { s, x: (vw - W * s) / 2, y: (vh - H * s) / 2 + 8 };
  }, [metrics]);

  // ---------- Initial position ----------

  useLayoutEffect(() => {
    desktop.current = window.matchMedia('(min-width: 768px)').matches;
    if (!desktop.current) return;
    let start = home();
    try {
      const saved = JSON.parse(sessionStorage.getItem(CAMERA_KEY) ?? 'null') as Camera | null;
      if (saved && saved.s === 1) start = clamp(saved);
    } catch {}
    apply(start);

    const onResize = () => {
      desktop.current = window.matchMedia('(min-width: 768px)').matches;
      if (desktop.current) apply(clamp(cam.current));
      else trayRef.current!.style.transform = '';
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [apply, clamp, home]);

  // Remember where the visitor was when they open a project, so Back returns there.
  useEffect(() => {
    const save = () => {
      if (!desktop.current || cam.current.s !== 1) return;
      try {
        sessionStorage.setItem(CAMERA_KEY, JSON.stringify(cam.current));
      } catch {}
    };
    window.addEventListener('pagehide', save);
    return () => {
      save();
      window.removeEventListener('pagehide', save);
    };
  }, []);

  // ---------- Drag, momentum, wheel ----------

  useEffect(() => {
    const viewport = viewportRef.current!;
    const tray = trayRef.current!;
    let drag: {
      id: number;
      x0: number;
      y0: number;
      cam: Camera;
      moved: boolean;
      vx: number;
      vy: number;
      t: number;
      px: number;
      py: number;
    } | null = null;
    let raf = 0;

    const stopMotion = () => {
      cancelAnimationFrame(raf);
      if (tray.classList.contains('gliding')) {
        // Freeze a glide mid-flight where it currently is.
        const m = new DOMMatrixReadOnly(getComputedStyle(tray).transform);
        tray.classList.remove('gliding');
        apply({ x: m.e, y: m.f, s: m.a });
      }
    };

    const stretch = (v: number, [lo, hi]: readonly [number, number]) =>
      v < lo ? lo - (lo - v) * RUBBER : v > hi ? hi + (v - hi) * RUBBER : v;

    const onDown = (e: PointerEvent) => {
      if (!desktop.current || e.button !== 0 || (e.target as HTMLElement).closest('input, [data-no-drag]')) return;
      stopMotion();
      drag = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        cam: { ...cam.current },
        moved: false,
        vx: 0,
        vy: 0,
        t: e.timeStamp,
        px: e.clientX,
        py: e.clientY,
      };
    };

    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        drag.moved = true;
        viewport.setPointerCapture(e.pointerId);
        viewport.classList.add('dragging');
        setTouched(true);
      }
      const dt = Math.max(1, e.timeStamp - drag.t);
      drag.vx = 0.8 * ((e.clientX - drag.px) / dt) * 16 + 0.2 * drag.vx;
      drag.vy = 0.8 * ((e.clientY - drag.py) / dt) * 16 + 0.2 * drag.vy;
      drag.t = e.timeStamp;
      drag.px = e.clientX;
      drag.py = e.clientY;
      const b = bounds(drag.cam.s);
      apply({ s: drag.cam.s, x: stretch(drag.cam.x + dx, b.x), y: stretch(drag.cam.y + dy, b.y) });
    };

    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { moved } = drag;
      let { vx, vy } = drag;
      drag = null;
      if (!moved) return;
      viewport.classList.remove('dragging');
      // A drag must not also count as a click on whatever card it ended over.
      const swallow = (ev: MouseEvent) => (ev.preventDefault(), ev.stopPropagation());
      viewport.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => viewport.removeEventListener('click', swallow, true), 0);

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) vx = vy = 0;
      const step = () => {
        vx *= FRICTION;
        vy *= FRICTION;
        const b = bounds(cam.current.s);
        const next = { s: cam.current.s, x: cam.current.x + vx, y: cam.current.y + vy };
        // Momentum dies quickly once it runs past an edge.
        if (next.x < b.x[0] || next.x > b.x[1]) vx *= 0.6;
        if (next.y < b.y[0] || next.y > b.y[1]) vy *= 0.6;
        apply({ s: next.s, x: stretch(next.x, b.x), y: stretch(next.y, b.y) });
        if (Math.hypot(vx, vy) > 0.3) raf = requestAnimationFrame(step);
        else glide(clamp(cam.current)); // spring back inside the tray
      };
      raf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      if (!desktop.current) return;
      e.preventDefault();
      stopMotion();
      setTouched(true);
      const c = cam.current;
      if (e.ctrlKey) {
        // Pinch / ctrl+scroll zooms around the pointer.
        const min = fitAll().s;
        const s = Math.min(1.15, Math.max(min, c.s * Math.exp(-e.deltaY * 0.01)));
        const k = s / c.s;
        apply(clamp({ s, x: e.clientX - (e.clientX - c.x) * k, y: e.clientY - (e.clientY - c.y) * k }));
        setOverview(s < 0.75);
      } else {
        apply(clamp({ s: c.s, x: c.x - e.deltaX, y: c.y - e.deltaY }));
      }
    };

    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointercancel', onUp);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      viewport.removeEventListener('pointerdown', onDown);
      viewport.removeEventListener('pointermove', onMove);
      viewport.removeEventListener('pointerup', onUp);
      viewport.removeEventListener('pointercancel', onUp);
      viewport.removeEventListener('wheel', onWheel);
    };
  }, [apply, bounds, clamp, fitAll, glide]);

  // ---------- Overview, focus, keyboard ----------

  const toggleOverview = useCallback(() => {
    if (!desktop.current) return;
    setTouched(true);
    setOverview((on) => {
      glide(on ? home() : fitAll());
      return !on;
    });
  }, [fitAll, glide, home]);

  // In overview, clicking a compartment flies to it instead of opening it.
  const onClickCapture = (e: React.MouseEvent) => {
    if (!overview || !desktop.current) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-card]');
    const card = el && board.cards.find((c) => c.key === el.dataset.card);
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    setOverview(false);
    glide(frame(rectOf([card]), 1));
  };

  // Keyboard focus pulls its compartment into view.
  const onFocusCapture = (e: React.FocusEvent) => {
    if (!desktop.current) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-card]');
    if (!el || !(e.target as HTMLElement).matches(':focus-visible')) return;
    const r = el.getBoundingClientRect();
    const { vw, vh } = metrics();
    if (cam.current.s === 1 && r.left >= 24 && r.top >= 24 && r.right <= vw - 24 && r.bottom <= vh - 24) return;
    const card = board.cards.find((c) => c.key === el.dataset.card);
    if (card) {
      setOverview(false);
      glide(frame(rectOf([card]), 1));
    }
  };

  /** Update the filter and fly the camera to whatever it matched. */
  const setFilter = useCallback(
    (nextQuery: string, nextCategory: string | null) => {
      setQuery(nextQuery);
      setCategory(nextCategory);
      const active = nextQuery.trim() !== '' || nextCategory !== null;
      const hitKeys = matchCards(board.cards, nextQuery, nextCategory);
      const hits = board.cards.filter((c) => hitKeys.has(c.key));
      if (!desktop.current) {
        if (active && hits[0]) {
          document
            .querySelector(`[data-card="${hits[0].key}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (!active) {
        setOverview(false);
        glide(home());
      } else if (hits.length) {
        const to = frame(rectOf(hits), 1);
        setOverview(to.s < 0.75);
        glide(to);
      }
    },
    [board.cards, frame, glide, home, rectOf],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (filtering) {
          setFilter('', null);
        } else if (overview) toggleOverview();
        (e.target as HTMLElement).blur?.();
        return;
      }
      if (typing || !desktop.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const pan: Record<string, [number, number]> = {
        ArrowLeft: [1, 0],
        ArrowRight: [-1, 0],
        ArrowUp: [0, 1],
        ArrowDown: [0, -1],
      };
      if (pan[e.key]) {
        e.preventDefault();
        const [dx, dy] = pan[e.key];
        const c = cam.current;
        glide(clamp({ ...c, x: c.x + dx * 240, y: c.y + dy * 240 }));
        setTouched(true);
      } else if (e.key === 'o' || e.key === 'z') toggleOverview();
      else if (e.key === '0' || e.key === 'Home') {
        setOverview(false);
        glide(home());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clamp, filtering, glide, home, overview, setFilter, toggleOverview]);

  // ---------- Render ----------

  const pickTech = useCallback(
    (tech: string) => setFilter(query.toLowerCase() === tech.toLowerCase() ? '' : tech, null),
    [query, setFilter],
  );

  const k = keystone;
  const trayStyle = {
    '--cols': board.cols,
    '--rows': board.rows,
    // Pre-hydration camera: centre the keystone with pure CSS so the first paint is already right.
    '--kx': `calc(var(--wall) + ${k.col + k.w / 2} * (var(--u) + var(--wall)) - var(--wall) / 2)`,
    '--ky': `calc(var(--wall) + ${k.row + k.h / 2} * (var(--u) + var(--wall)) - var(--wall) / 2)`,
  } as React.CSSProperties;

  // Mobile reading order: priority as packed, which puts the keystone first.
  const ordered = useMemo(
    () => [...board.cards].sort((a, b) => order(a) - order(b) || a.row - b.row || a.col - b.col),
    [board.cards],
  );

  return (
    <>
      <div ref={viewportRef} className="board-viewport" data-overview={overview || undefined}>
        <div ref={trayRef} className="tray board-tray" style={trayStyle}>
          {ordered.map((card, i) => {
            const dim =
              filtering &&
              card.kind !== 'intro' &&
              !matches.has(card.key) &&
              !(card.kind === 'tech' && card.tech.toLowerCase() === needle);
            return (
              <div
                key={card.key}
                data-card={card.key}
                data-kind={card.kind}
                data-span={card.mobileSpan}
                data-dim={dim || undefined}
                inert={dim || undefined}
                className={`board-slot ${card.kind === 'intro' ? '' : 'cell'}`}
                style={
                  {
                    '--c': card.col + 1,
                    '--r': card.row + 1,
                    '--w': card.w,
                    '--h': card.h,
                    '--ms': card.mobileSpan,
                  } as React.CSSProperties
                }
              >
                <CardBody card={card} priority={i < 8} needle={needle} onPickTech={pickTech} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="dock" data-no-drag>
        <div className="crt flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-cell)] px-4 text-xl lg:min-w-[19rem]">
          <span className="text-orange">&gt;</span>
          <label htmlFor="board-filter" className="sr-only">
            Filter projects
          </label>
          <input
            id="board-filter"
            ref={inputRef}
            value={query}
            onChange={(e) => setFilter(e.target.value, category)}
            placeholder="filter: ros2, hackathon, pcb…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-phosphor outline-none placeholder:text-phosphor/40"
          />
          {!touched && !filtering && (
            <span className="hidden shrink-0 text-phosphor/45 md:inline">drag · scroll · o</span>
          )}
          {filtering && (
            <span className="shrink-0 text-phosphor/60">
              {matches.size}/{projectCount}
            </span>
          )}
        </div>
        <div className="no-scrollbar hidden min-w-0 items-center gap-1 overflow-x-auto lg:flex">
          {board.categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(query, category === c ? null : c)}
              aria-pressed={category === c}
              className={`h-12 shrink-0 rounded-[var(--radius-cell)] px-3 text-sm transition-colors ${
                category === c ? 'bg-rice text-lacquer' : 'bg-cell text-ash hover:text-rice'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleOverview}
          className="hidden h-12 shrink-0 rounded-[var(--radius-cell)] bg-cell px-4 text-sm text-ash hover:text-rice md:block"
          aria-pressed={overview}
          title="Overview (O)"
        >
          {overview ? 'Zoom in' : 'Overview'}
        </button>
        <Link
          href="/projects"
          className="flex h-12 shrink-0 items-center rounded-[var(--radius-cell)] bg-cell px-4 text-sm text-ash hover:text-rice"
        >
          List
        </Link>
      </div>
    </>
  );
}

function matchCards(cards: BoardCard[], query: string, category: string | null) {
  const needle = query.trim().toLowerCase();
  const ids = new Set<string>();
  for (const c of cards) {
    if (c.kind !== 'project') continue;
    if (category && c.project.category !== category) continue;
    if (needle && !c.project.search.includes(needle)) continue;
    ids.add(c.key);
  }
  return ids;
}

const ORDER: Record<BoardCard['kind'], number> = {
  intro: 0,
  project: 1,
  experience: 2,
  about: 3,
  resume: 4,
  tech: 5,
  empty: 6,
};
function order(c: BoardCard) {
  if (c.kind === 'project') return c.project.featured ? 1 : 3.5;
  return ORDER[c.kind];
}

function CardBody({
  card,
  priority,
  needle,
  onPickTech,
}: {
  card: BoardCard;
  priority: boolean;
  needle: string;
  onPickTech: (tech: string) => void;
}) {
  switch (card.kind) {
    case 'intro':
      return <IntroCard card={card} />;
    case 'project':
      return <ProjectCard card={card} priority={priority} />;
    case 'experience':
      return <ExperienceCard card={card} />;
    case 'about':
      return <AboutCard card={card} />;
    case 'resume':
      return <ResumeCard card={card} />;
    case 'tech':
      return <TechCard card={card} active={card.tech.toLowerCase() === needle} onPick={() => onPickTech(card.tech)} />;
    case 'empty':
      return <div className="empty-compartment h-full" aria-hidden="true" />;
  }
}
