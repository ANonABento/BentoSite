'use client';

/** Edit one project: every field the content schema supports, plus uploads. */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  PROJECT_STATUSES,
  studioApi,
  toSlug,
  type StudioProject,
} from './studio-api';
import {
  Field,
  TextArea,
  TextField,
  buttonClass,
  dangerButtonClass,
  inputClass,
  listToText,
  primaryButtonClass,
  textToList,
} from './studio-ui';

interface ProjectFormProps {
  project: StudioProject;
  isNew: boolean;
  categories: string[];
  onSave: (project: StudioProject) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({
  project,
  isNew,
  categories,
  onSave,
  onDelete,
  onCancel,
}: ProjectFormProps) {
  const [draft, setDraft] = useState<StudioProject>(project);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(project);
    setConfirmingDelete(false);
  }, [project]);

  const patch = (changes: Partial<StudioProject>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const patchMedia = (changes: Partial<NonNullable<StudioProject['media']>>) =>
    setDraft((current) => ({ ...current, media: { ...current.media, ...changes } }));

  const patchLinks = (changes: Partial<NonNullable<StudioProject['links']>>) =>
    setDraft((current) => ({ ...current, links: { ...current.links, ...changes } }));

  const upload = async (file: File, target: 'hero' | 'gallery') => {
    if (!draft.id) return;
    setBusy(true);
    try {
      const { path } = await studioApi.uploadProjectAsset(draft.id, file, 'image');
      if (target === 'hero') {
        patchMedia({ featuredImage: path });
      } else {
        patchMedia({ images: [...(draft.media?.images ?? []), path] });
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await onSave(draft);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Name"
          value={draft.name}
          onChange={(name) =>
            patch(isNew ? { name, id: toSlug(name) } : { name })
          }
        />
        <TextField
          label="Id"
          value={draft.id}
          disabled={!isNew}
          hint={isNew ? 'Filename and URL slug.' : 'Fixed after creation.'}
          onChange={(id) => patch({ id: toSlug(id) })}
        />
      </div>

      <TextField
        label="Short description"
        value={draft.shortDescription}
        hint="One line. Used on the card."
        onChange={(shortDescription) => patch({ shortDescription })}
      />

      <TextArea
        label="Description"
        value={draft.description ?? ''}
        rows={6}
        hint="Long form, shown in the project surface. Blank lines separate paragraphs."
        onChange={(description) => patch({ description })}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Category">
          <input
            className={inputClass}
            list="studio-categories"
            value={draft.category}
            onChange={(event) => patch({ category: event.target.value })}
          />
          <datalist id="studio-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={draft.status}
            onChange={(event) =>
              patch({ status: event.target.value as StudioProject['status'] })
            }
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <TextField
          label="Date completed"
          value={draft.dateCompleted ?? ''}
          hint="YYYY or YYYY-MM"
          onChange={(dateCompleted) => patch({ dateCompleted })}
        />
      </div>

      <TextField
        label="Technologies"
        value={listToText(draft.technologies)}
        hint="Comma separated."
        onChange={(text) => patch({ technologies: textToList(text) })}
      />

      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={Boolean(draft.featured)}
          onChange={(event) => patch({ featured: event.target.checked })}
        />
        Featured on the dashboard grid
      </label>

      <fieldset className="space-y-3 rounded-md border border-[var(--border)] p-3">
        <legend className="px-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Links
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="GitHub" value={draft.links?.github ?? ''} onChange={(github) => patchLinks({ github })} />
          <TextField label="Live demo" value={draft.links?.liveDemo ?? ''} onChange={(liveDemo) => patchLinks({ liveDemo })} />
          <TextField label="Docs / Devpost" value={draft.links?.docs ?? ''} onChange={(docs) => patchLinks({ docs })} />
          <TextField label="3D model path" value={draft.links?.modelPath ?? ''} onChange={(modelPath) => patchLinks({ modelPath })} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-[var(--border)] p-3">
        <legend className="px-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Media
        </legend>

        <div className="flex items-start gap-3">
          {draft.media?.featuredImage ? (
            <Image
              src={draft.media.featuredImage}
              alt=""
              width={160}
              height={100}
              className="h-[100px] w-[160px] rounded border border-[var(--border)] object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-[100px] w-[160px] items-center justify-center rounded border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
              no hero
            </div>
          )}
          <div className="flex-1 space-y-2">
            <TextField
              label="Hero image"
              value={draft.media?.featuredImage ?? ''}
              onChange={(featuredImage) => patchMedia({ featuredImage })}
            />
            <button
              type="button"
              className={buttonClass}
              disabled={busy || !draft.id}
              onClick={() => heroInputRef.current?.click()}
            >
              Upload hero…
            </button>
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file, 'hero');
                event.target.value = '';
              }}
            />
          </div>
        </div>

        <Field label="Gallery images">
          <div className="space-y-2">
            {(draft.media?.images ?? []).map((src) => (
              <div key={src} className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-[var(--glass-bg)] px-2 py-1 text-xs">{src}</code>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    patchMedia({ images: (draft.media?.images ?? []).filter((item) => item !== src) })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className={buttonClass}
              disabled={busy || !draft.id}
              onClick={() => galleryInputRef.current?.click()}
            >
              Add image…
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file, 'gallery');
                event.target.value = '';
              }}
            />
          </div>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Video URL" value={draft.media?.video ?? ''} onChange={(video) => patchMedia({ video })} />
          <TextField label="Website URL" value={draft.media?.website ?? ''} onChange={(website) => patchMedia({ website })} />
          <TextField label="PDF path" value={draft.media?.pdf ?? ''} onChange={(pdf) => patchMedia({ pdf })} />
          <TextField
            label="Game URL"
            value={draft.media?.game?.url ?? ''}
            hint="itch.io embed URL, or a profile URL for an external link."
            onChange={(url) =>
              patchMedia({ game: url ? { type: draft.media?.game?.type ?? 'itch', url } : undefined })
            }
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
        <button type="button" className={primaryButtonClass} disabled={busy} onClick={() => void submit()}>
          {isNew ? 'Create project' : 'Save project'}
        </button>
        <button type="button" className={buttonClass} onClick={onCancel}>
          Cancel
        </button>
        {draft.media?.featuredImage ? (
          <a className={buttonClass} href={`/?project=${draft.id}`} target="_blank" rel="noreferrer">
            Preview
          </a>
        ) : null}
        <span className="flex-1" />
        {!isNew ? (
          confirmingDelete ? (
            <>
              <span className="text-xs text-[var(--text-muted)]">Delete {draft.id}?</span>
              <button
                type="button"
                className={dangerButtonClass}
                disabled={busy}
                onClick={() => void onDelete(draft.id)}
              >
                Yes, delete
              </button>
              <button type="button" className={buttonClass} onClick={() => setConfirmingDelete(false)}>
                Keep
              </button>
            </>
          ) : (
            <button type="button" className={dangerButtonClass} onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
