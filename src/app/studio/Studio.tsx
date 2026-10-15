'use client';

/**
 * Studio — the board editor (dev only). Shows the real tile with the real
 * cards, with a faded ring of the neighbouring copies so the seams are
 * visible. Drag a card to move it, drag its edges to resize it; cards it
 * lands on step aside to the nearest free spot. The tile wraps: drag a card
 * over an edge and it hangs into the next copy, showing up on the opposite
 * side too. The inspector frames the selected card. Save writes
 * src/content/layout.json.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  GRID,
  GRID_STEP,
  LAYOUT_SEARCH_ID,
  MAX_SPAN,
  THEMES,
  copyOffset,
  firstClash,
  fits,
  getCardDimensions,
  holes,
  nearestFreeSpot,
  placeCard,
  sizeOf,
  wrapRect,
  type BoardLayout,
  type CardData,
  type CardPosition,
  type InfoContent,
  type IntroProfile,
  type LayoutCard,
  type ProjectCardData,
} from '@/components/BentoGrid';
import { CONTACT, INTRO, makeRenderCard } from '../_components/ProjectsGridClient';
import { AnimatePresence } from 'framer-motion';
import { Viewfinder } from '@/components/Viewfinder/Viewfinder';
import type { ViewfinderItem, ViewfinderProject } from '@/components/Viewfinder/types';
import { Inspector } from './Inspector';
import { useLayoutHistory } from './useLayoutHistory';

const THEME = THEMES.premium;
/** How much of the neighbouring copies shows around the tile, in px. */
const MARGIN = GRID_STEP * 1.5;

type Handle = 'move' | 'e' | 's' | 'se';
interface Drag {
  id: string;
  handle: Handle;
  /** Cell offset of the pointer inside the card when a move started. */
  grab: { col: number; row: number };
  /** Top-left cell of the copy of the card that was grabbed, in tile cells. */
  origin: { x: number; y: number };
  preview: Omit<LayoutCard, 'id' | 'look'>;
  moved: boolean;
}

export interface StudioProps {
  initialLayout: BoardLayout;
  projects: ProjectCardData[];
  /** Every file in each project's public folder. */
  files: Record<string, string[]>;
  details: Record<string, ViewfinderProject>;
  /** What each project's viewfinder shows with no list of its own. */
  viewfinderDefaults: Record<string, ViewfinderItem[]>;
  /** Which projects have their own viewfinder list. */
  viewfinderCustom: Record<string, boolean>;
  profile: IntroProfile;
  info: InfoContent;
}

/** A project's viewfinder as edited: its own list, or the default. */
export interface ViewfinderEdit {
  custom: boolean;
  items: ViewfinderItem[];
}

const IMAGE_FILE = /\.(png|jpe?g|webp|avif|gif)$/i;

/** Default footprint for a card placed from the tray. */
function defaultSpan(id: string) {
  if (id === 'intro') return { w: 3, h: 2 };
  if (id === LAYOUT_SEARCH_ID || id === CONTACT.id) return { w: 2, h: 1 };
  return { w: 2, h: 2 };
}

export function Studio({
  initialLayout,
  projects,
  files: initialFiles,
  details,
  viewfinderDefaults,
  viewfinderCustom,
  profile,
  info,
}: StudioProps) {
  const history = useLayoutHistory(initialLayout);
  const { layout, commit, undo, redo, dirty: layoutDirty, markSaved } = history;
  const [files, setFiles] = useState(initialFiles);

  // Viewfinder lists live in the project files, so they save separately from
  // the layout (and sit outside undo).
  const initialViewfinders = useMemo(
    () =>
      Object.fromEntries(
        projects.map((p) => [p.id, { custom: viewfinderCustom[p.id], items: viewfinderCustom[p.id] ? details[p.id].items : viewfinderDefaults[p.id] }]),
      ) as Record<string, ViewfinderEdit>,
    [projects, details, viewfinderDefaults, viewfinderCustom],
  );
  const [viewfinders, setViewfinders] = useState(initialViewfinders);
  const [savedViewfinders, setSavedViewfinders] = useState(initialViewfinders);
  const changedViewfinders = Object.keys(viewfinders).filter(
    (id) => JSON.stringify(viewfinders[id]) !== JSON.stringify(savedViewfinders[id]),
  );
  const dirty = layoutDirty || changedViewfinders.length > 0;
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [scale, setScale] = useState(0.5);
  const [neighbours, setNeighbours] = useState(true);
  const [status, setStatus] = useState<{ text: string; tone: 'ok' | 'warn' | 'error' } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const renderCard = useMemo(() => makeRenderCard(profile, info), [profile, info]);

  const say = useCallback((text: string, tone: 'ok' | 'warn' | 'error' = 'ok') => setStatus({ text, tone }), []);
  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  /** Commit a placement and report any card that had nowhere to go. */
  const place = useCallback(
    (base: BoardLayout, id: string, rect: Omit<LayoutCard, 'id' | 'look'>, key?: string) => {
      const { layout: next, removed } = placeCard(base, id, rect);
      commit(next, key);
      if (removed.length) say(`No room for ${removed.join(', ')}; moved to Unplaced.`, 'warn');
    },
    [commit, say],
  );

  // While dragging, show the layout as it would be if dropped now, cards stepping aside and all.
  const view = useMemo(() => (drag?.moved ? placeCard(layout, drag.id, drag.preview).layout : layout), [layout, drag]);
  const tileW = layout.cols * GRID_STEP;
  const tileH = layout.rows * GRID_STEP;
  const gaps = useMemo(() => holes(view), [view]);

  // ---- data for each placed card ----------------------------------------
  const cardFor = useCallback(
    (placed: LayoutCard): CardData | 'search' | null => {
      if (placed.id === LAYOUT_SEARCH_ID) return 'search';
      if (placed.id === INTRO.id) return INTRO;
      if (placed.id === CONTACT.id) return CONTACT;
      const project = projectById.get(placed.id);
      return project ? { ...project, size: sizeOf(placed), look: placed.look } : null;
    },
    [projectById],
  );

  // ---- zoom -----------------------------------------------------------------
  const fit = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const s = Math.min((el.clientWidth - 48) / (tileW + MARGIN * 2), (el.clientHeight - 48) / (tileH + MARGIN * 2), 1);
    setScale(Math.max(0.15, Math.round(s * 100) / 100));
  }, [tileW, tileH]);
  const fittedOnce = useRef(false);
  useEffect(() => {
    if (fittedOnce.current) return;
    fittedOnce.current = true;
    fit();
  }, [fit]);

  // ---- pointer editing ------------------------------------------------------
  const pointerCell = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const rect = boardRef.current!.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
    },
    [scale],
  );

  const startDrag = (event: React.PointerEvent, card: LayoutCard, handle: Handle, at: { col: number; row: number }) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    setSelected(card.id);
    const p = pointerCell(event);
    setDrag({
      id: card.id,
      handle,
      grab: { col: Math.floor(p.x / GRID_STEP) - card.col, row: Math.floor(p.y / GRID_STEP) - card.row },
      origin: { x: at.col, y: at.row },
      preview: { col: card.col, row: card.row, w: card.w, h: card.h },
      moved: false,
    });
  };

  useEffect(() => {
    if (!drag) return;
    const card = layout.cards.find((c) => c.id === drag.id);
    if (!card) return;
    const locked = card.id === LAYOUT_SEARCH_ID;

    // Where the card would go with the pointer here. Both move and release
    // compute it from their own event, so a quick release never drops a step behind.
    const previewAt = (event: PointerEvent) => {
      const p = pointerCell(event);
      const next = { col: card.col, row: card.row, w: card.w, h: card.h };
      // Positions are taken from the card's own copy, so a card grabbed in a
      // neighbouring copy moves with the pointer too; the wrap folds it back.
      if (drag.handle === 'move') {
        next.col = Math.floor(p.x / GRID_STEP) - drag.grab.col;
        next.row = Math.floor(p.y / GRID_STEP) - drag.grab.row;
        Object.assign(next, wrapRect(layout, next));
      } else if (!locked) {
        const from = { x: drag.origin.x * GRID_STEP, y: drag.origin.y * GRID_STEP };
        if (drag.handle !== 's') next.w = clamp(Math.ceil((p.x - from.x) / GRID_STEP), 1, Math.min(MAX_SPAN.w, layout.cols));
        if (drag.handle !== 'e') next.h = clamp(Math.ceil((p.y - from.y) / GRID_STEP), 1, Math.min(MAX_SPAN.h, layout.rows));
      }
      const changed = next.col !== card.col || next.row !== card.row || next.w !== card.w || next.h !== card.h;
      return { next, changed };
    };
    const onMove = (event: PointerEvent) => {
      const { next, changed } = previewAt(event);
      setDrag((d) => (d ? { ...d, preview: next, moved: d.moved || changed } : d));
    };
    const onUp = (event: PointerEvent) => {
      const { next, changed } = previewAt(event);
      if (changed) place(layout, drag.id, next);
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, layout, pointerCell, place]);

  // ---- edits used by the inspector and keys ---------------------------------
  const selectedCard = layout.cards.find((c) => c.id === selected) ?? null;

  const resize = useCallback(
    (id: string, w: number, h: number) => {
      const card = layout.cards.find((c) => c.id === id);
      if (!card) return;
      const rect = { col: card.col, row: card.row, w, h };
      if (!fits(layout, rect)) return say(`The tile is too small for ${w}x${h}.`, 'warn');
      place(layout, id, rect);
    },
    [layout, place, say],
  );

  const setLook = useCallback(
    (id: string, look: LayoutCard['look'], key?: string) => {
      commit({ ...layout, cards: layout.cards.map((c) => (c.id === id ? tidyLook({ ...c, look }) : c)) }, key);
    },
    [layout, commit],
  );

  const unplace = useCallback(
    (id: string) => {
      commit({ ...layout, cards: layout.cards.filter((c) => c.id !== id) });
      setSelected(null);
    },
    [layout, commit],
  );

  const placeFromTray = useCallback(
    (id: string) => {
      const { w, h } = defaultSpan(id);
      const centre = { col: Math.floor(layout.cols / 2), row: Math.floor(layout.rows / 2) };
      let base = layout;
      let spot = nearestFreeSpot(base, w, h, centre);
      if (!spot) {
        // No room: grow the tile downward to make some.
        base = { ...layout, rows: layout.rows + h };
        spot = { col: 0, row: layout.rows };
        say(`Grew the tile to ${base.cols}x${base.rows} to fit it.`, 'warn');
      }
      commit({ ...base, cards: [...base.cards, { id, ...spot, w, h }] });
      setSelected(id);
    },
    [layout, commit, say],
  );

  const resizeTile = useCallback(
    (cols: number, rows: number, shift: number) => {
      const next: BoardLayout = { ...layout, cols, rows, shift: Math.min(shift, cols - 1) || undefined };
      if (layout.cards.some((card) => !fits(next, card))) return say('Cards are in the way; move them first.', 'warn');
      const clash = firstClash(next);
      if (clash) return say(`That would wrap ${clash[0].id} onto ${clash[1].id}; move one first.`, 'warn');
      commit(next);
    },
    [layout, commit, say],
  );

  // ---- uploads -----------------------------------------------------------------
  const upload = useCallback(
    async (projectId: string, files: FileList | File[]) => {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set('project', projectId);
        form.set('file', file);
        const res = await fetch('/api/studio/upload', { method: 'POST', body: form });
        const body = await res.json();
        if (!res.ok) {
          say(body.error ?? 'Upload failed', 'error');
          continue;
        }
        uploaded.push(body.src);
        setFiles((all) => ({ ...all, [projectId]: [...(all[projectId] ?? []), body.src] }));
      }
      return uploaded;
    },
    [say],
  );

  const uploadToCard = useCallback(
    async (projectId: string, files: FileList) => {
      const uploaded = await upload(projectId, files);
      if (!uploaded.length) return;
      // An image becomes the thumbnail right away; framing starts fresh.
      const src = uploaded.find((file) => IMAGE_FILE.test(file));
      const card = layout.cards.find((c) => c.id === projectId);
      if (card && src) setLook(projectId, { ...card.look, image: src, focus: undefined, zoom: undefined });
      setSelected(projectId);
      say(src ? 'Uploaded; now the thumbnail.' : 'Uploaded to Files.');
    },
    [upload, layout, setLook, say],
  );

  // ---- save -----------------------------------------------------------------
  const save = useCallback(async () => {
    const saved: string[] = [];
    if (layoutDirty) {
      const res = await fetch('/api/studio', { method: 'POST', body: JSON.stringify(layout) });
      if (!res.ok) return say((await res.json()).error ?? 'Save failed', 'error');
      markSaved(layout);
      saved.push('layout.json');
    }
    for (const id of changedViewfinders) {
      const edit = viewfinders[id];
      const res = await fetch('/api/studio/project', {
        method: 'POST',
        body: JSON.stringify({ id, viewfinder: edit.custom ? edit.items : null }),
      });
      if (!res.ok) return say((await res.json()).error ?? 'Save failed', 'error');
      setSavedViewfinders((all) => ({ ...all, [id]: edit }));
      saved.push(`${id}.json`);
    }
    if (saved.length) say(`Saved ${saved.join(', ')}.`);
  }, [layoutDirty, layout, markSaved, changedViewfinders, viewfinders, say]);

  const editViewfinder = useCallback(
    (id: string, items: ViewfinderItem[] | null) =>
      setViewfinders((all) => ({ ...all, [id]: items ? { custom: true, items } : { custom: false, items: viewfinderDefaults[id] } })),
    [viewfinderDefaults],
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ---- keys -------------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === 's') {
        event.preventDefault();
        void save();
        return;
      }
      if (isTyping(event.target)) return;
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (event.key === 'Escape') setSelected(null);
      if (!selectedCard) return;
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        unplace(selectedCard.id);
      }
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (step) {
        event.preventDefault();
        const rect = wrapRect(layout, { col: selectedCard.col + step[0], row: selectedCard.row + step[1], w: selectedCard.w, h: selectedCard.h });
        if (fits(layout, rect)) place(layout, selectedCard.id, rect);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, undo, redo, selectedCard, unplace, layout, place]);

  // ---- rendering ----------------------------------------------------------------
  const renderPlaced = (placed: LayoutCard, offset: { x: number; y: number }, key: string): ReactNode => {
    const card = cardFor(placed);
    if (!card) return null;
    const dims = getCardDimensions(sizeOf(placed));
    const position: CardPosition = { x: placed.col * GRID_STEP + offset.x, y: placed.row * GRID_STEP + offset.y, ...dims, rotation: 0, size: sizeOf(placed) };
    if (card === 'search') {
      return (
        <div
          key={key}
          className="absolute flex items-center px-5 font-crt text-2xl"
          style={{
            left: position.x,
            top: position.y,
            width: dims.width,
            height: dims.height,
            borderRadius: THEME.card.borderRadius,
            background: 'var(--board-dock-bg)',
            color: 'var(--board-dock-fg)',
          }}
        >
          &gt; search projects
        </div>
      );
    }
    return <div key={key}>{renderCard(card, position, THEME, false, undefined, 0)}</div>;
  };

  // Every copy of every card near the tile. Inside the tile they draw solid
  // (that's where wrapped cards show up opposite); around it, faded.
  const instances = view.cards.flatMap((c) =>
    [-1, 0, 1].flatMap((j) =>
      [-2, -1, 0, 1, 2].map((i) => {
        const o = copyOffset(layout, { i, j });
        const col = o.col + c.col;
        const row = o.row + c.row;
        const { width, height } = getCardDimensions(sizeOf(c));
        return {
          card: c,
          main: i === 0 && j === 0,
          col,
          row,
          x: col * GRID_STEP,
          y: row * GRID_STEP,
          width,
          height,
          // Keyed by where it is, bucketed half a tile off the seams, so a card
          // glides as it crosses an edge instead of its copies swapping places.
          key: `${c.id}@${Math.floor((col + layout.cols / 2) / layout.cols)},${Math.floor((row + layout.rows / 2) / layout.rows)}`,
        };
      }),
    ),
  );
  const inTile = (n: (typeof instances)[number]) => n.x < tileW && n.x + n.width > 0 && n.y < tileH && n.y + n.height > 0;
  const nearTile = (n: (typeof instances)[number]) =>
    n.x < tileW + MARGIN && n.x + n.width > -MARGIN && n.y < tileH + MARGIN && n.y + n.height > -MARGIN;
  const unplaced = [
    ...[INTRO.id, LAYOUT_SEARCH_ID, CONTACT.id].filter((id) => !layout.cards.some((c) => c.id === id)).map((id) => ({ id, title: id === LAYOUT_SEARCH_ID ? 'Search card' : id === INTRO.id ? 'Intro' : 'Contact', thumbnail: undefined as string | undefined })),
    ...projects.filter((p) => !layout.cards.some((c) => c.id === p.id)),
  ];
  const displaced = drag?.moved
    ? new Set(view.cards.filter((c) => { const before = layout.cards.find((b) => b.id === c.id); return c.id !== drag.id && before && (before.col !== c.col || before.row !== c.row); }).map((c) => c.id))
    : new Set<string>();

  return (
    <div className="fixed inset-0 flex flex-col bg-lacquer text-rice">
      <Toolbar
        dirty={dirty}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        scale={scale}
        neighbours={neighbours}
        tile={`${layout.cols}x${layout.rows}${layout.shift ? ` shift ${layout.shift}` : ''}`}
        holes={gaps.length}
        status={status}
        onSave={save}
        onUndo={undo}
        onRedo={redo}
        onZoom={(factor) => setScale((s) => clamp(Math.round(s * factor * 100) / 100, 0.15, 1.5))}
        onFit={fit}
        onNeighbours={() => setNeighbours((n) => !n)}
      />
      <div className="flex min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="board-canvas relative min-w-0 flex-1 overflow-auto"
          onPointerDown={() => setSelected(null)}
        >
          <div style={{ width: (tileW + MARGIN * 2) * scale + 48, height: (tileH + MARGIN * 2) * scale + 48, padding: 24 }}>
            <div className="relative overflow-hidden" style={{ width: (tileW + MARGIN * 2) * scale, height: (tileH + MARGIN * 2) * scale }}>
              <div
                className="absolute left-0 top-0"
                style={{ width: tileW + MARGIN * 2, height: tileH + MARGIN * 2, transform: `scale(${scale})`, transformOrigin: '0 0' }}
              >
                {/* Neighbouring copies, faded, so the seams show. */}
                {neighbours && (
                  <div className="pointer-events-none absolute opacity-30" style={{ left: MARGIN, top: MARGIN }}>
                    {instances.filter(nearTile).map((n) => renderPlaced(n.card, { x: n.x - n.card.col * GRID_STEP, y: n.y - n.card.row * GRID_STEP }, n.key))}
                  </div>
                )}

                <div ref={boardRef} className="absolute" style={{ left: MARGIN, top: MARGIN, width: tileW - GRID.GAP, height: tileH - GRID.GAP }}>
                  {/* Tile outline and empty cells. */}
                  <div
                    className="pointer-events-none absolute -inset-[7px] rounded-[18px] border-2 border-dashed border-orange/50"
                  />
                  {gaps.map(([c, r]) => (
                    <div
                      key={`${c},${r}`}
                      className="pointer-events-none absolute rounded-xl border border-orange/40"
                      style={{
                        left: c * GRID_STEP,
                        top: r * GRID_STEP,
                        width: GRID.CELL_SIZE,
                        height: GRID.CELL_SIZE,
                        background: 'repeating-linear-gradient(45deg, rgb(232 130 63 / 0.12) 0 8px, transparent 8px 16px)',
                      }}
                    />
                  ))}

                  {/* The cards themselves, clipped to the tile (half a gap past its
                      edge, so the seam's gap is split evenly). Interaction happens on the layer above. */}
                  <div
                    className="pointer-events-none absolute overflow-hidden"
                    style={{ left: -GRID.GAP / 2, top: -GRID.GAP / 2, width: tileW, height: tileH }}
                  >
                    {instances.filter(inTile).map((n) =>
                      renderPlaced(n.card, { x: n.x - n.card.col * GRID_STEP + GRID.GAP / 2, y: n.y - n.card.row * GRID_STEP + GRID.GAP / 2 }, n.key),
                    )}
                  </div>

                  {/* Hit areas, outlines and resize handles, for every copy that shows in the tile. */}
                  {instances.filter(inTile).map((n) => {
                    const c = n.card;
                    const isSelected = c.id === selected;
                    const isDragged = drag?.id === c.id;
                    const project = projectById.has(c.id);
                    const at = { col: n.col, row: n.row };
                    return (
                      <div
                        key={n.key}
                        className={`group absolute rounded-[14px] ${isDragged ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{
                          left: n.x,
                          top: n.y,
                          width: n.width,
                          height: n.height,
                          outline: isSelected ? '4px solid var(--color-orange)' : displaced.has(c.id) ? '3px dashed var(--color-purple)' : undefined,
                          outlineOffset: 3,
                          transition: 'left 150ms, top 150ms, width 150ms, height 150ms',
                        }}
                        onPointerDown={(e) => startDrag(e, c, 'move', at)}
                        onDragOver={project ? (e) => e.preventDefault() : undefined}
                        onDrop={
                          project
                            ? (e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files.length) void uploadToCard(c.id, e.dataTransfer.files);
                              }
                            : undefined
                        }
                      >
                        <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 font-crt text-xl leading-none text-rice opacity-0 transition-opacity group-hover:opacity-100">
                          {c.w}x{c.h}
                        </span>
                        {c.id !== LAYOUT_SEARCH_ID && (
                          <>
                            <Grip className="-right-3 top-1/2 h-16 w-6 -translate-y-1/2 cursor-ew-resize" onPointerDown={(e) => startDrag(e, c, 'e', at)} />
                            <Grip className="-bottom-3 left-1/2 h-6 w-16 -translate-x-1/2 cursor-ns-resize" onPointerDown={(e) => startDrag(e, c, 's', at)} />
                            <Grip className="-bottom-3 -right-3 h-8 w-8 cursor-nwse-resize" onPointerDown={(e) => startDrag(e, c, 'se', at)} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Inspector
          layout={layout}
          card={selectedCard}
          project={selectedCard ? projectById.get(selectedCard.id) ?? null : null}
          unplaced={unplaced}
          holes={gaps.length}
          onClose={() => setSelected(null)}
          onResize={resize}
          onLook={setLook}
          onUnplace={unplace}
          onPlace={placeFromTray}
          onUpload={upload}
          onResizeTile={resizeTile}
          files={selectedCard ? files[selectedCard.id] ?? [] : []}
          viewfinder={selectedCard ? viewfinders[selectedCard.id] ?? null : null}
          onViewfinder={editViewfinder}
          onPreview={setPreview}
        />
        <AnimatePresence>
          {preview && details[preview] && (
            <Viewfinder
              key={preview}
              project={{ ...details[preview], items: viewfinders[preview].items }}
              origin={null}
              onClose={() => setPreview(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Grip({ className, onPointerDown }: { className: string; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div className={`absolute z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 ${className}`} onPointerDown={onPointerDown}>
      <div className="h-[60%] w-[60%] min-h-2 min-w-2 rounded-full border-2 border-lacquer bg-orange" />
    </div>
  );
}

function Toolbar(props: {
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  scale: number;
  neighbours: boolean;
  tile: string;
  holes: number;
  status: { text: string; tone: 'ok' | 'warn' | 'error' } | null;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoom: (factor: number) => void;
  onFit: () => void;
  onNeighbours: () => void;
}) {
  const button = 'rounded-md px-2.5 py-1 text-sm text-ash hover:bg-cell-raised hover:text-rice disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-wall px-4">
      <span className="font-crt text-2xl leading-none text-orange">studio</span>
      <span className="mr-2 text-xs text-ash">
        tile {props.tile} · {props.holes ? <span className="text-orange">{props.holes} empty cells</span> : 'no holes'}
      </span>
      <button className={button} onClick={props.onUndo} disabled={!props.canUndo} title="Undo (⌘Z)">
        Undo
      </button>
      <button className={button} onClick={props.onRedo} disabled={!props.canRedo} title="Redo (⇧⌘Z)">
        Redo
      </button>
      <span className="mx-1 h-5 w-px bg-wall" />
      <button className={button} onClick={() => props.onZoom(1 / 1.2)} aria-label="Zoom out">
        −
      </button>
      <span className="w-10 text-center font-crt text-lg text-ash">{Math.round(props.scale * 100)}%</span>
      <button className={button} onClick={() => props.onZoom(1.2)} aria-label="Zoom in">
        +
      </button>
      <button className={button} onClick={props.onFit}>
        Fit
      </button>
      <button className={button} onClick={props.onNeighbours} aria-pressed={props.neighbours}>
        {props.neighbours ? '☑' : '☐'} Neighbours
      </button>

      <span className="flex-1" />
      {props.status && (
        <span className={`text-sm ${props.status.tone === 'error' ? 'text-red-400' : props.status.tone === 'warn' ? 'text-orange' : 'text-ash'}`}>
          {props.status.text}
        </span>
      )}
      <a className={button} href="/" target="_blank" rel="noreferrer">
        Open board ↗
      </a>
      <button
        className="rounded-md bg-orange px-3 py-1 text-sm font-medium text-lacquer hover:brightness-110 disabled:bg-cell-raised disabled:text-ash"
        onClick={props.onSave}
        disabled={!props.dirty}
        title="Save (⌘S)"
      >
        {props.dirty ? 'Save ●' : 'Saved'}
      </button>
    </header>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/** Drop framing fields left at their defaults, so layout.json only holds real choices. */
function tidyLook(card: LayoutCard): LayoutCard {
  const look = { ...card.look };
  if (look.focus && look.focus[0] === 50 && look.focus[1] === 50) delete look.focus;
  if (look.zoom === 1) delete look.zoom;
  for (const key of Object.keys(look) as (keyof typeof look)[]) if (look[key] === undefined) delete look[key];
  const { look: _drop, ...rest } = card;
  return Object.keys(look).length ? { ...rest, look } : rest;
}
