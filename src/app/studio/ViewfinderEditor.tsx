'use client';

/**
 * The studio's viewfinder editor for one project: the items it shows, in
 * order. Each item is a kind (which viewer), a source and an optional tab
 * name. Images share one gallery tab; everything else gets its own. Files
 * from the project folder are added from the Files shelf; links are added here.
 */

import Image from 'next/image';
import { KIND_LABELS, type ViewfinderItem, type ViewfinderKind } from '@/components/Viewfinder/types';
import type { ViewfinderEdit } from './Studio';

const KINDS: ViewfinderKind[] = ['image', 'video', 'embed', 'model', 'pdf'];
const KIND_HINTS: Record<ViewfinderKind, string> = {
  image: '/projects/<id>/shot.png',
  video: 'YouTube, Vimeo or an .mp4 link',
  embed: 'https://… (live demo, itch.io, Figma…)',
  model: '/projects/<id>/model.stl or .glb',
  pdf: '/projects/<id>/report.pdf',
};

/** The kind a file most likely is, from its extension. */
export function kindOf(src: string): ViewfinderKind {
  if (/\.(png|jpe?g|webp|avif|gif)$/i.test(src)) return 'image';
  if (/\.(stl|glb|gltf)$/i.test(src)) return 'model';
  if (/\.pdf$/i.test(src)) return 'pdf';
  if (/\.(mp4|webm|mov)$/i.test(src)) return 'video';
  return 'embed';
}

interface ViewfinderEditorProps {
  edit: ViewfinderEdit;
  onChange: (items: ViewfinderItem[] | null) => void;
  onPreview: () => void;
}

export function ViewfinderEditor({ edit, onChange, onPreview }: ViewfinderEditorProps) {
  const { items, custom } = edit;

  const update = (index: number, patch: Partial<ViewfinderItem>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(Math.max(0, Math.min(next.length, index + delta)), 0, item);
    onChange(next);
  };
  const add = (item: ViewfinderItem) => onChange([...items, item]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ash">{custom ? 'Its own list.' : 'Default: its images, then its live demo.'}</p>
        <div className="flex gap-1.5">
          {custom && (
            <button className="rounded-md px-2 py-1 text-xs text-ash hover:bg-cell-raised hover:text-rice" onClick={() => onChange(null)}>
              Reset
            </button>
          )}
          <button className="rounded-md bg-cell-raised px-2 py-1 text-xs text-rice hover:bg-orange hover:text-lacquer" onClick={onPreview}>
            Preview
          </button>
        </div>
      </div>

      {items.length === 0 && <p className="text-xs text-orange">Nothing yet. Add files from the shelf above, or a link below.</p>}
      <ol className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex flex-col gap-1.5 rounded-lg bg-cell-raised p-2">
            <div className="flex items-center gap-1.5">
              {item.kind === 'image' && item.src ? (
                <span className="relative h-7 w-9 shrink-0 overflow-hidden rounded bg-lacquer">
                  <Image src={item.src} alt="" fill sizes="36px" className="object-cover" />
                </span>
              ) : null}
              <select
                value={item.kind}
                onChange={(e) => update(index, { kind: e.target.value as ViewfinderKind })}
                className="rounded bg-lacquer px-1.5 py-1 text-xs text-rice"
                aria-label="Kind"
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
              <input
                value={item.label ?? ''}
                onChange={(e) => update(index, { label: e.target.value || undefined })}
                placeholder={item.kind === 'image' ? 'caption' : `tab: ${KIND_LABELS[item.kind]}`}
                className="min-w-0 flex-1 rounded bg-lacquer px-2 py-1 text-xs text-rice placeholder:text-ash/60"
              />
              <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                ↑
              </IconButton>
              <IconButton label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                ↓
              </IconButton>
              <IconButton label="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                ✕
              </IconButton>
            </div>
            <input
              value={item.src}
              onChange={(e) => update(index, { src: e.target.value })}
              placeholder={KIND_HINTS[item.kind]}
              className={`rounded bg-lacquer px-2 py-1 font-mono text-[11px] text-rice placeholder:text-ash/60 ${item.src.trim() ? '' : 'ring-1 ring-orange'}`}
              aria-label="Source"
            />
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-ash">Add a link:</span>
        <AddButton onClick={() => add({ kind: 'video', src: '' })}>Video</AddButton>
        <AddButton onClick={() => add({ kind: 'embed', src: '' })}>Live page</AddButton>
        <AddButton onClick={() => add({ kind: 'model', src: '' })}>3D</AddButton>
        <AddButton onClick={() => add({ kind: 'pdf', src: '' })}>PDF</AddButton>
      </div>
    </div>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-6 w-6 shrink-0 rounded text-xs text-ash hover:bg-lacquer hover:text-rice disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-full border border-wall px-2.5 py-1 text-xs text-ash hover:border-orange hover:text-orange">
      {children}
    </button>
  );
}
