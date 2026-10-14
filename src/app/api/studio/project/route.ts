import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import type { ViewfinderItem } from '@/components/Viewfinder/types';
import { getProject } from '@/lib/content';

const KINDS = new Set(['image', 'video', 'embed', 'model', 'pdf']);

/**
 * Saves a project's viewfinder list from /studio into its JSON file
 * (`media.viewfinder`); null removes it, so the project falls back to its
 * images and live demo. Dev only: it writes into the repo.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });

  const { id, viewfinder } = (await request.json()) as { id: string; viewfinder: ViewfinderItem[] | null };
  if (!getProject(id)) return NextResponse.json({ error: `no project "${id}"` }, { status: 400 });
  if (viewfinder !== null) {
    const bad = viewfinder.find((item) => !KINDS.has(item?.kind) || typeof item.src !== 'string' || !item.src.trim());
    if (bad) return NextResponse.json({ error: `${id}: every viewfinder item needs a kind and a source` }, { status: 400 });
  }

  const file = path.join(process.cwd(), 'src/content/projects', `${id}.json`);
  const project = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (viewfinder === null) delete project.media.viewfinder;
  else project.media.viewfinder = viewfinder.map(({ kind, src, label }) => (label?.trim() ? { kind, src: src.trim(), label: label.trim() } : { kind, src: src.trim() }));
  fs.writeFileSync(file, JSON.stringify(project, null, 2) + '\n');
  return NextResponse.json({ ok: true });
}
