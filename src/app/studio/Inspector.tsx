'use client';

/**
 * The studio's side panel. With a card selected, top to bottom: its size; the
 * card on the board (what it shows, its thumbnail and how that's framed); the
 * project's files, each of which can be the thumbnail or go in the viewfinder;
 * and the viewfinder (what opens when the card is clicked). With nothing
 * selected: the tile's size and the cards that aren't on the board.
 */

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  MAX_SPAN,
  getCardDimensions,
  minTileSize,
  sizeOf,
  type BoardLayout,
  type CardLook,
  type CardVariant,
  type LayoutCard,
  type ProjectCardData,
} from '@/components/BentoGrid';
import { KIND_LABELS, type ViewfinderItem } from '@/components/Viewfinder/types';
import type { ViewfinderEdit } from './Studio';
import { ViewfinderEditor, kindOf } from './ViewfinderEditor';

interface InspectorProps {
  layout: BoardLayout;
  card: LayoutCard | null;
  project: ProjectCardData | null;
  unplaced: { id: string; title: string; thumbnail?: string }[];
  holes: number;
  onClose: () => void;
  onResize: (id: string, w: number, h: number) => void;
  onLook: (id: string, look: CardLook | undefined, key?: string) => void;
  onUnplace: (id: string) => void;
  onPlace: (id: string) => void;
  onUpload: (id: string, files: FileList | File[]) => Promise<string[]>;
  onResizeTile: (cols: number, rows: number) => void;
  files: string[];
  viewfinder: ViewfinderEdit | null;
  onViewfinder: (id: string, items: ViewfinderItem[] | null) => void;
  onPreview: (id: string) => void;
}

export function Inspector(props: InspectorProps) {
  return (
    <aside className="w-[360px] shrink-0 overflow-y-auto border-l border-wall bg-cell">
      {props.card ? <CardPanel {...props} card={props.card} /> : <BoardPanel {...props} />}
    </aside>
  );
}

// ---------------------------------------------------------------------------

function BoardPanel({ layout, unplaced, holes, onPlace, onResizeTile }: InspectorProps) {
  const min = minTileSize(layout);
  return (
    <div className="flex flex-col gap-6 p-5">
      <Section title="Tile">
        <p className="text-xs leading-relaxed text-ash">
          The tile repeats in every direction. Cards can&apos;t cross its edge; shrink it only after moving cards out of the way.
        </p>
        <div className="flex gap-4">
          <Stepper label="Columns" value={layout.cols} min={min.cols} max={40} onChange={(cols) => onResizeTile(cols, layout.rows)} />
          <Stepper label="Rows" value={layout.rows} min={min.rows} max={30} onChange={(rows) => onResizeTile(layout.cols, rows)} />
        </div>
        <p className="text-xs text-ash">{holes ? <span className="text-orange">{holes} empty cells (hatched).</span> : 'No empty cells.'}</p>
      </Section>

      <Section title={`Unplaced (${unplaced.length})`}>
        {unplaced.length === 0 ? (
          <p className="text-xs text-ash">Everything is on the board.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {unplaced.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg bg-cell-raised p-1.5 pr-2">
                <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-lacquer">
                  {item.thumbnail ? <Image src={item.thumbnail} alt="" fill sizes="56px" className="object-cover" /> : null}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                <button className="rounded-md px-2 py-1 text-xs text-orange hover:bg-lacquer" onClick={() => onPlace(item.id)}>
                  Place
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Keys">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-ash">
          <dt className="font-crt text-base leading-none text-rice">drag</dt><dd>move; cards in the way step aside</dd>
          <dt className="font-crt text-base leading-none text-rice">edges</dt><dd>resize (hover a card for handles)</dd>
          <dt className="font-crt text-base leading-none text-rice">arrows</dt><dd>nudge the selected card</dd>
          <dt className="font-crt text-base leading-none text-rice">⌫</dt><dd>take it off the board</dd>
          <dt className="font-crt text-base leading-none text-rice">⌘Z ⇧⌘Z</dt><dd>undo, redo</dd>
          <dt className="font-crt text-base leading-none text-rice">⌘S</dt><dd>save to layout.json</dd>
          <dt className="font-crt text-base leading-none text-rice">drop</dt><dd>a file on a card to upload it (an image becomes the thumbnail)</dd>
        </dl>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function CardPanel({
  card,
  project,
  files,
  viewfinder,
  onClose,
  onResize,
  onLook,
  onUnplace,
  onUpload,
  onViewfinder,
  onPreview,
}: InspectorProps & { card: LayoutCard }) {
  const look = card.look ?? {};
  const fixedSize = card.id === 'search';
  const setLook = (patch: Partial<CardLook>, key?: string) => onLook(card.id, { ...look, ...patch }, key);
  const thumbnail = look.image ?? project?.thumbnail;
  const showsImage = (look.variant ?? 'full') !== 'text';
  const items = viewfinder?.items ?? [];

  return (
    <div className="flex flex-col gap-7 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">{project?.title ?? card.id}</h2>
          <p className="font-crt text-lg leading-none text-ash">
            at {card.col},{card.row}
            {project?.category ? ` · ${project.category}` : ''}
          </p>
        </div>
        <button className="rounded-md px-2 py-1 text-sm text-ash hover:bg-cell-raised hover:text-rice" onClick={onClose} aria-label="Deselect">
          ✕
        </button>
      </div>

      <Section title="Size">
        {fixedSize ? (
          <p className="text-xs text-ash">The search card is always 2x1.</p>
        ) : (
          <div className="flex items-end gap-3">
            <Stepper label="Columns" value={card.w} min={1} max={MAX_SPAN.w} onChange={(w) => onResize(card.id, w, card.h)} />
            <span className="pb-1.5 font-crt text-xl leading-none text-ash">×</span>
            <Stepper label="Rows" value={card.h} min={1} max={MAX_SPAN.h} onChange={(h) => onResize(card.id, card.w, h)} />
          </div>
        )}
      </Section>

      {project && (
        <Section title="Card" hint="How it looks on the board.">
          <div className="flex flex-wrap gap-1.5">
            {([undefined, 'full', 'image', 'text'] as (CardVariant | undefined)[]).map((variant) => (
              <Chip key={variant ?? 'auto'} active={look.variant === variant} onClick={() => setLook({ variant })}>
                {{ auto: 'Auto', full: 'Image + footer', image: 'Image only', text: 'Text only' }[variant ?? 'auto']}
              </Chip>
            ))}
          </div>
          {look.variant === undefined && (
            <p className="text-xs text-ash">Auto: a footer on cards 3+ wide, image only on smaller ones, text if there&apos;s no image.</p>
          )}
          {(look.variant ?? 'full') === 'full' && (
            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-xs text-ash">Description</span>
              {([['Auto', undefined], ['On', true], ['Off', false]] as const).map(([label, value]) => (
                <Chip key={label} active={look.description === value} onClick={() => setLook({ description: value })}>
                  {label}
                </Chip>
              ))}
            </div>
          )}

          {showsImage &&
            (thumbnail ? (
              <>
                <p className="-mb-1 text-xs text-ash">
                  Thumbnail{look.image && look.image !== project.thumbnail ? '' : ' (default)'}: drag to frame it.
                </p>
                <FramingPreview
                  src={thumbnail}
                  card={card}
                  footer={look.variant === 'full' || (look.variant === undefined && card.w >= 3)}
                  focus={look.focus ?? [50, 50]}
                  zoom={look.zoom ?? 1}
                  onFocus={(focus) => setLook({ focus }, `focus:${card.id}`)}
                />
                <label className="flex items-center gap-3 text-xs text-ash">
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={look.zoom ?? 1}
                    onChange={(e) => setLook({ zoom: Number(e.target.value) }, `zoom:${card.id}`)}
                    className="flex-1 accent-orange"
                  />
                  <span className="w-10 text-right font-crt text-base text-rice">{(look.zoom ?? 1).toFixed(2)}×</span>
                </label>
                <div className="flex gap-3 text-xs text-ash">
                  <button className="underline-offset-2 hover:text-rice hover:underline" onClick={() => setLook({ focus: undefined, zoom: undefined })}>
                    Reset framing
                  </button>
                  {look.image && look.image !== project.thumbnail && (
                    <button
                      className="underline-offset-2 hover:text-rice hover:underline"
                      onClick={() => setLook({ image: undefined, focus: undefined, zoom: undefined })}
                    >
                      Back to the default thumbnail
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-orange">No thumbnail. Pick one in Files below.</p>
            ))}
        </Section>
      )}

      {project && viewfinder && (
        <>
          <Section title="Files" hint="Everything in the project's folder. Set the card's thumbnail, or toggle what the viewfinder shows.">
            <FileShelf
              files={files}
              defaultThumbnail={project.thumbnail}
              thumbnail={thumbnail}
              viewfinder={items}
              onThumbnail={(src) => setLook({ image: src === project.thumbnail ? undefined : src, focus: undefined, zoom: undefined })}
              onViewfinder={(src) => {
                const at = items.findIndex((item) => item.src === src);
                onViewfinder(card.id, at >= 0 ? items.filter((_, i) => i !== at) : [...items, { kind: kindOf(src), src }]);
              }}
              onUpload={(list) => onUpload(card.id, list)}
            />
          </Section>

          <Section title="Viewfinder" hint="What opens when the card is clicked, in order.">
            <ViewfinderEditor edit={viewfinder} onChange={(next) => onViewfinder(card.id, next)} onPreview={() => onPreview(card.id)} />
          </Section>
        </>
      )}

      <button className="self-start rounded-md px-2 py-1 text-xs text-ash hover:bg-cell-raised hover:text-rice" onClick={() => onUnplace(card.id)}>
        Take off the board (⌫)
      </button>
    </div>
  );
}

const IMAGE_FILE = /\.(png|jpe?g|webp|avif|gif)$/i;

/**
 * The project's folder as one shelf. Each file shows whether it's the
 * thumbnail and where it sits in the viewfinder, with a button for each.
 * Uploads (or files dropped on the shelf) land here.
 */
function FileShelf({
  files,
  defaultThumbnail,
  thumbnail,
  viewfinder,
  onThumbnail,
  onViewfinder,
  onUpload,
}: {
  files: string[];
  defaultThumbnail?: string;
  thumbnail?: string;
  viewfinder: ViewfinderItem[];
  onThumbnail: (src: string) => void;
  onViewfinder: (src: string) => void;
  onUpload: (files: FileList) => Promise<string[]>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const all = defaultThumbnail && !files.includes(defaultThumbnail) ? [defaultThumbnail, ...files] : files;

  const take = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    await onUpload(list);
    setBusy(false);
  };

  return (
    <div
      className={`grid grid-cols-3 gap-1.5 rounded-lg ${over ? 'outline-2 outline-offset-2 outline-dashed outline-orange' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void take(e.dataTransfer.files);
      }}
    >
      {all.map((src) => {
        const image = IMAGE_FILE.test(src);
        const isThumbnail = src === thumbnail;
        const place = viewfinder.findIndex((item) => item.src === src);
        return (
          <div key={src} className="flex flex-col gap-1">
            <div
              className={`relative aspect-[4/3] overflow-hidden rounded-md bg-lacquer ${isThumbnail ? 'ring-2 ring-orange' : ''}`}
              title={src.split('/').pop()}
            >
              {image ? (
                <Image src={src} alt="" fill sizes="110px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-crt text-lg text-ash">{KIND_LABELS[kindOf(src)]}</span>
              )}
              <span className="absolute inset-x-1 bottom-1 truncate rounded bg-black/70 px-1 text-[10px] text-ash">{src.split('/').pop()}</span>
              {place >= 0 && (
                <span className="absolute right-1 top-1 rounded bg-purple px-1 font-crt text-sm leading-tight text-lacquer" title="Its place in the viewfinder">
                  {place + 1}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {image && (
                <ShelfButton active={isThumbnail} onClick={() => onThumbnail(src)} label={isThumbnail ? 'The thumbnail' : 'Use as thumbnail'}>
                  Thumb
                </ShelfButton>
              )}
              <ShelfButton active={place >= 0} onClick={() => onViewfinder(src)} label={place >= 0 ? 'Take out of the viewfinder' : 'Add to the viewfinder'}>
                {place >= 0 ? 'In VF' : '+ VF'}
              </ShelfButton>
            </div>
          </div>
        );
      })}
      <button
        onClick={() => input.current?.click()}
        className="flex aspect-[4/3] flex-col items-center justify-center rounded-md border border-dashed border-wall text-xs text-ash hover:border-orange hover:text-orange"
      >
        {busy ? 'Uploading…' : <>+ Upload<span className="text-[10px] opacity-70">or drop here</span></>}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept="image/*,.stl,.glb,.gltf,.pdf,.mp4,.webm,.mov"
        onChange={(e) => void take(e.target.files)}
      />
    </div>
  );
}

function ShelfButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex-1 rounded px-1 py-0.5 text-[10px] font-medium transition-colors ${
        active ? 'bg-orange text-lacquer' : 'bg-cell-raised text-ash hover:text-rice'
      }`}
    >
      {children}
    </button>
  );
}

/** The card's image area at its real proportions. Drag to set the focal point. */
function FramingPreview({
  src,
  card,
  footer,
  focus,
  zoom,
  onFocus,
}: {
  src: string;
  card: LayoutCard;
  footer: boolean;
  focus: [number, number];
  zoom: number;
  onFocus: (focus: [number, number]) => void;
}) {
  const { width, height } = getCardDimensions(sizeOf(card));
  // The footer takes about this much of the card in the `full` variant.
  const imageHeight = footer ? Math.max(60, height - (height > 300 ? 92 : 72)) : height;
  const ref = useRef<HTMLDivElement>(null);

  const set = (event: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)));
    onFocus([x, y]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg bg-lacquer" style={{ aspectRatio: `${width} / ${imageHeight}` }}>
        <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: `${focus[0]}% ${focus[1]}%` }}>
          <Image src={src} alt="" fill sizes="320px" className="object-cover" style={{ objectPosition: `${focus[0]}% ${focus[1]}%` }} draggable={false} />
        </div>
      </div>
      <p className="text-xs text-ash">The whole image; the dot is what stays in view.</p>
      {/* The whole image, uncropped, with the focal point on it. */}
      <div
        ref={ref}
        className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-lg bg-lacquer"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          set(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) set(e);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- needs the image's natural aspect ratio */}
        <img src={src} alt="" className="block w-full" draggable={false} />
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgb(0_0_0/0.6)]"
          style={{ left: `${focus[0]}%`, top: `${focus[1]}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-ash">{title}</h3>
        {hint && <p className="text-xs text-ash/70">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-orange text-lacquer' : 'bg-cell-raised text-ash hover:text-rice'
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const button = 'h-7 w-7 rounded-md bg-cell-raised text-ash hover:text-rice disabled:opacity-30';
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-ash">{label}</span>
      <div className="flex items-center gap-1.5">
        <button className={button} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label.toLowerCase()}`}>
          −
        </button>
        <span className="w-7 text-center font-crt text-xl leading-none">{value}</span>
        <button className={button} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}
