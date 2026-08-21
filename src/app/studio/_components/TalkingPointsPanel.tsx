'use client';

/** FAQ-style content the chat assistant answers from. */

import { useState } from 'react';
import { studioApi, toSlug, type StudioTalkingPoint } from './studio-api';
import {
  TextArea,
  TextField,
  buttonClass,
  dangerButtonClass,
  listToText,
  primaryButtonClass,
  textToList,
} from './studio-ui';

interface TalkingPointsPanelProps {
  points: StudioTalkingPoint[];
  onReload: () => Promise<void>;
  report: (message: string, kind?: 'ok' | 'error' | 'busy', details?: string[]) => void;
}

const EMPTY: StudioTalkingPoint = { id: '', title: '', content: '', keywords: [] };

export function TalkingPointsPanel({ points, onReload, report }: TalkingPointsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<StudioTalkingPoint>(EMPTY);

  const selected = creating ? EMPTY : points.find((point) => point.id === selectedId) ?? null;

  // Adjust state during render (React's documented alternative to a
  // setState-in-effect) when the selection changes.
  const [lastSelected, setLastSelected] = useState(selected);
  if (lastSelected !== selected) {
    setLastSelected(selected);
    setDraft(selected ?? EMPTY);
  }

  const save = async () => {
    report('Saving…', 'busy');
    try {
      await studioApi.saveTalkingPoint(draft);
      await onReload();
      setCreating(false);
      setSelectedId(draft.id);
      report(`Saved ${draft.id}. Run Sync to publish it.`, 'ok');
    } catch (error) {
      const apiError = error as Error & { details?: string[] };
      report(apiError.message, 'error', apiError.details);
    }
  };

  const remove = async () => {
    report('Deleting…', 'busy');
    try {
      await studioApi.deleteTalkingPoint(draft.id);
      await onReload();
      setSelectedId(null);
      report(`Deleted ${draft.id}.`, 'ok');
    } catch (error) {
      report((error as Error).message, 'error');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(220px,300px)_1fr]">
      <section className="space-y-2">
        <header className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Talking points ({points.length})
          </h2>
          <span className="flex-1" />
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
            }}
          >
            New
          </button>
        </header>
        <ul className="space-y-1">
          {points.map((point) => (
            <li key={point.id}>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setSelectedId(point.id);
                }}
                className={`w-full rounded-md border px-2 py-2 text-left text-sm ${
                  selectedId === point.id
                    ? 'border-[var(--orange)] bg-[var(--glass-bg)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <span className="block truncate text-[var(--text-primary)]">{point.title}</span>
                <code className="block truncate text-xs text-[var(--text-muted)]">{point.id}</code>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        {selected ? (
          <>
            <TextField
              label="Title"
              value={draft.title}
              onChange={(title) =>
                setDraft((current) => ({
                  ...current,
                  title,
                  id: creating ? toSlug(title) : current.id,
                }))
              }
            />
            <TextField
              label="Id"
              value={draft.id}
              disabled={!creating}
              onChange={(id) => setDraft((current) => ({ ...current, id: toSlug(id) }))}
            />
            <TextArea
              label="Content"
              rows={8}
              hint="Written as an answer. The assistant quotes from this."
              value={draft.content}
              onChange={(content) => setDraft((current) => ({ ...current, content }))}
            />
            <TextField
              label="Keywords"
              hint="Comma separated. Synonyms a visitor might ask in."
              value={listToText(draft.keywords)}
              onChange={(text) => setDraft((current) => ({ ...current, keywords: textToList(text) }))}
            />
            <div className="flex gap-2">
              <button type="button" className={primaryButtonClass} onClick={() => void save()}>
                {creating ? 'Create' : 'Save'}
              </button>
              <span className="flex-1" />
              {!creating ? (
                <button type="button" className={dangerButtonClass} onClick={() => void remove()}>
                  Delete
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Pick a talking point, or create one.</p>
        )}
      </section>
    </div>
  );
}
