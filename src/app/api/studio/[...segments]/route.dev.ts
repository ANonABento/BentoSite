/**
 * Studio API — local authoring endpoints. Development only.
 *
 * This file is named `route.dev.ts`, and `pageExtensions` in next.config.ts
 * only includes `.dev.ts` outside production, so a production build never
 * registers these routes. The runtime guard below is belt-and-braces for
 * anyone running `next dev` on a public interface.
 *
 * All filesystem work goes through scripts/content-repo.mjs, the same module
 * the `npm run add:*` CLIs use.
 */

import { NextResponse } from 'next/server';

import {
  commitContent,
  ContentError,
  deletePhoto,
  deleteProject,
  deleteTalkingPoint,
  listPhotos,
  listProjects,
  listTalkingPoints,
  readPortfolio,
  reorderProjects,
  runSync,
  saveProjectAsset,
  savePhotoFile,
  writePhotoSidecar,
  writePortfolio,
  writeProject,
  writeTalkingPoint,
  // Plain ESM module, shared with the `npm run add:*` CLIs.
} from '../../../../../scripts/content-repo.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ segments: string[] }> };

function devOnly(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

function fail(error: unknown): NextResponse {
  if (error instanceof ContentError || (error as { name?: string })?.name === 'ContentError') {
    const contentError = error as ContentError & { status?: number; details?: string[] };
    return NextResponse.json(
      { error: contentError.message, details: contentError.details ?? [] },
      { status: contentError.status ?? 400 },
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status: 500 });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ContentError('Expected a JSON object body.');
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw new ContentError('Body was not valid JSON.');
  }
}

export async function GET(request: Request, { params }: Params) {
  const blocked = devOnly();
  if (blocked) return blocked;

  const [resource] = (await params).segments;
  try {
    switch (resource) {
      case 'projects':
        return NextResponse.json({ projects: await listProjects() });
      case 'talking-points':
        return NextResponse.json({ points: await listTalkingPoints() });
      case 'photos':
        return NextResponse.json({ photos: await listPhotos() });
      case 'portfolio':
        return NextResponse.json({ portfolio: await readPortfolio() });
      default:
        return NextResponse.json({ error: `Unknown resource "${resource}"` }, { status: 404 });
    }
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const blocked = devOnly();
  if (blocked) return blocked;

  const segments = (await params).segments;
  const [resource, action] = segments;

  try {
    if (resource === 'projects' && action === 'reorder') {
      const body = await readBody(request);
      return NextResponse.json({ order: await reorderProjects(body.ids) });
    }

    if (resource === 'projects') {
      const body = await readBody(request);
      return NextResponse.json({ project: await writeProject(body.project ?? body) });
    }

    if (resource === 'talking-points') {
      const body = await readBody(request);
      return NextResponse.json({ point: await writeTalkingPoint(body.point ?? body) });
    }

    if (resource === 'portfolio') {
      const body = await readBody(request);
      return NextResponse.json({ portfolio: await writePortfolio(body.portfolio ?? body) });
    }

    if (resource === 'photos' && action === 'meta') {
      const body = await readBody(request);
      return NextResponse.json({
        sidecar: await writePhotoSidecar(body.slug, body.meta ?? body),
      });
    }

    if (resource === 'photos' || resource === 'assets') {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) {
        throw new ContentError('Expected a `file` field.');
      }
      const buffer = Buffer.from(await file.arrayBuffer());

      if (resource === 'photos') {
        return NextResponse.json({ photo: await savePhotoFile(file.name, buffer) });
      }

      const projectId = String(form.get('projectId') ?? '');
      const kind = String(form.get('kind') ?? 'image');
      return NextResponse.json({
        path: await saveProjectAsset(projectId, file.name, buffer, { kind }),
      });
    }

    if (resource === 'sync') {
      return NextResponse.json(await runSync());
    }

    if (resource === 'git') {
      const body = await readBody(request);
      return NextResponse.json(
        await commitContent(body.message, { push: body.push === true }),
      );
    }

    return NextResponse.json({ error: `Unknown resource "${resource}"` }, { status: 404 });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const blocked = devOnly();
  if (blocked) return blocked;

  const [resource] = (await params).segments;
  const id = new URL(request.url).searchParams.get('id') ?? '';

  try {
    switch (resource) {
      case 'projects':
        await deleteProject(id);
        return NextResponse.json({ ok: true });
      case 'talking-points':
        await deleteTalkingPoint(id);
        return NextResponse.json({ ok: true });
      case 'photos':
        await deletePhoto(id);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: `Unknown resource "${resource}"` }, { status: 404 });
    }
  } catch (error) {
    return fail(error);
  }
}
