'use client';

/** Photo library: upload, edit the four sidecar fields, delete. */

import { useRef, useState } from 'react';
import Image from 'next/image';
import { studioApi, type StudioPhoto } from './studio-api';
import { TextField, buttonClass, dangerButtonClass, primaryButtonClass } from './studio-ui';

interface PhotosPanelProps {
  photos: StudioPhoto[];
  onReload: () => Promise<void>;
  report: (message: string, kind?: 'ok' | 'error' | 'busy', details?: string[]) => void;
}

type Draft = Pick<StudioPhoto, 'title' | 'location' | 'year' | 'alt'>;

function draftsFromPhotos(photos: StudioPhoto[]): Record<string, Draft> {
  return Object.fromEntries(
    photos.map((photo) => [
      photo.slug,
      { title: photo.title, location: photo.location, year: photo.year, alt: photo.alt },
    ]),
  );
}

export function PhotosPanel({ photos, onReload, report }: PhotosPanelProps) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => draftsFromPhotos(photos));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset the per-photo drafts whenever a reload hands us a new photos array.
  const [lastPhotos, setLastPhotos] = useState(photos);
  if (lastPhotos !== photos) {
    setLastPhotos(photos);
    setDrafts(draftsFromPhotos(photos));
  }

  const patch = (slug: string, changes: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [slug]: { ...current[slug], ...changes } }));

  const upload = async (file: File) => {
    report('Uploading…', 'busy');
    try {
      const { photo } = await studioApi.uploadPhoto(file);
      await onReload();
      report(`Uploaded ${photo.slug}. Fill in its four fields, then Save.`, 'ok');
    } catch (error) {
      report((error as Error).message, 'error');
    }
  };

  const save = async (slug: string) => {
    report('Saving…', 'busy');
    try {
      await studioApi.savePhotoMeta(slug, drafts[slug]);
      await onReload();
      report(`Saved ${slug}. Run Sync to rebuild the manifest.`, 'ok');
    } catch (error) {
      const apiError = error as Error & { details?: string[] };
      report(apiError.message, 'error', apiError.details);
    }
  };

  const remove = async (slug: string) => {
    report('Deleting…', 'busy');
    try {
      await studioApi.deletePhoto(slug);
      await onReload();
      report(`Deleted ${slug}.`, 'ok');
    } catch (error) {
      report((error as Error).message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Photos ({photos.length})
        </h2>
        <button type="button" className={buttonClass} onClick={() => fileInputRef.current?.click()}>
          Upload photo…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = '';
          }}
        />
        <p className="text-xs text-[var(--text-muted)]">
          A photo without all four fields is skipped by the build.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {photos.map((photo) => {
          const draft = drafts[photo.slug];
          if (!draft) return null;
          return (
            <li
              key={photo.slug}
              className={`space-y-2 rounded-md border p-3 ${
                photo.hasSidecar ? 'border-[var(--border)]' : 'border-[var(--status-error)]/50'
              }`}
            >
              <div className="flex gap-3">
                <Image
                  src={photo.src}
                  alt={photo.alt || photo.slug}
                  width={120}
                  height={80}
                  className="h-20 w-[120px] rounded object-cover"
                  unoptimized
                />
                <div className="min-w-0 flex-1">
                  <code className="block truncate text-xs text-[var(--text-muted)]">
                    {photo.file}
                  </code>
                  {!photo.hasSidecar ? (
                    <p className="text-xs text-[var(--status-error)]">Missing metadata</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <TextField label="Title" value={draft.title} onChange={(title) => patch(photo.slug, { title })} />
                <TextField label="Location" value={draft.location} onChange={(location) => patch(photo.slug, { location })} />
                <TextField label="Year" value={draft.year} onChange={(year) => patch(photo.slug, { year })} />
                <TextField label="Alt text" value={draft.alt} onChange={(alt) => patch(photo.slug, { alt })} />
              </div>

              <div className="flex gap-2">
                <button type="button" className={primaryButtonClass} onClick={() => void save(photo.slug)}>
                  Save
                </button>
                <span className="flex-1" />
                <button type="button" className={dangerButtonClass} onClick={() => void remove(photo.slug)}>
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
