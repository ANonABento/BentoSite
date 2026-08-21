'use client';

/**
 * portfolio.json: identity, about, and skills get real fields. Experience and
 * education stay as validated JSON — they are nested, rarely edited, and a
 * hand-rolled repeater would be more surface than it is worth.
 */

import { useState } from 'react';
import { studioApi, type StudioPortfolio } from './studio-api';
import {
  TextArea,
  TextField,
  listToText,
  primaryButtonClass,
  textToList,
} from './studio-ui';

interface BioPanelProps {
  portfolio: StudioPortfolio | null;
  onReload: () => Promise<void>;
  report: (message: string, kind?: 'ok' | 'error' | 'busy', details?: string[]) => void;
}

const PERSONAL_FIELDS = [
  'name',
  'title',
  'location',
  'email',
  'github',
  'linkedin',
  'university',
  'degree',
] as const;

export function BioPanel({ portfolio, onReload, report }: BioPanelProps) {
  const [draft, setDraft] = useState<StudioPortfolio | null>(portfolio);
  const [experienceText, setExperienceText] = useState(() =>
    JSON.stringify(portfolio?.experience ?? [], null, 2),
  );
  const [educationText, setEducationText] = useState(() =>
    JSON.stringify(portfolio?.education ?? [], null, 2),
  );

  // Adjust during render when a reload replaces the loaded portfolio.
  const [lastPortfolio, setLastPortfolio] = useState(portfolio);
  if (lastPortfolio !== portfolio) {
    setLastPortfolio(portfolio);
    setDraft(portfolio);
    setExperienceText(JSON.stringify(portfolio?.experience ?? [], null, 2));
    setEducationText(JSON.stringify(portfolio?.education ?? [], null, 2));
  }

  if (!draft) {
    return <p className="text-sm text-[var(--text-muted)]">Loading portfolio…</p>;
  }

  const save = async () => {
    let experience: unknown[];
    let education: unknown[];
    try {
      experience = JSON.parse(experienceText);
      education = JSON.parse(educationText);
    } catch (error) {
      report(`Experience/education JSON is invalid: ${(error as Error).message}`, 'error');
      return;
    }

    report('Saving…', 'busy');
    try {
      await studioApi.savePortfolio({ ...draft, experience, education });
      await onReload();
      report('Saved portfolio.json. Run Sync to validate and publish.', 'ok');
    } catch (error) {
      const apiError = error as Error & { details?: string[] };
      report(apiError.message, 'error', apiError.details);
    }
  };

  const patchPersonal = (key: string, value: string) =>
    setDraft((current) =>
      current ? { ...current, personal: { ...current.personal, [key]: value } } : current,
    );

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Bio</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {PERSONAL_FIELDS.map((field) => (
          <TextField
            key={field}
            label={field}
            value={draft.personal[field] ?? ''}
            onChange={(value) => patchPersonal(field, value)}
          />
        ))}
      </div>

      <TextArea
        label="About"
        rows={6}
        value={draft.about}
        onChange={(about) => setDraft((current) => (current ? { ...current, about } : current))}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {(['hardware', 'software', 'tools'] as const).map((group) => (
          <TextField
            key={group}
            label={`Skills — ${group}`}
            hint="Comma separated."
            value={listToText(draft.skills[group])}
            onChange={(text) =>
              setDraft((current) =>
                current
                  ? { ...current, skills: { ...current.skills, [group]: textToList(text) } }
                  : current,
              )
            }
          />
        ))}
      </div>

      <TextArea
        label="Experience (JSON)"
        rows={12}
        hint="Each entry needs id, company, role, location, coordinates, period, description, type, technologies."
        value={experienceText}
        onChange={setExperienceText}
      />

      <TextArea
        label="Education (JSON)"
        rows={8}
        hint="Each entry needs id, institution, degree, period, location, coordinates."
        value={educationText}
        onChange={setEducationText}
      />

      <button type="button" className={primaryButtonClass} onClick={() => void save()}>
        Save bio
      </button>
    </div>
  );
}
