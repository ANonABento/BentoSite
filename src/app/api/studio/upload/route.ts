import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getProject } from '@/lib/content';

/** Images for cards and galleries, plus what the viewfinder can show: models, PDFs and video files. */
const ALLOWED = /\.(png|jpe?g|webp|avif|gif|stl|glb|gltf|pdf|mp4|webm|mov)$/i;

/** Adds a file to public/projects/<id>/ from /studio. Dev only: it writes into the repo. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });

  const form = await request.formData();
  const id = String(form.get('project') ?? '');
  const file = form.get('file');
  if (!getProject(id)) return NextResponse.json({ error: `no project "${id}"` }, { status: 400 });
  if (!(file instanceof File) || !ALLOWED.test(file.name)) {
    return NextResponse.json({ error: 'expected an image, a model (stl, glb, gltf), a pdf or a video (mp4, webm, mov)' }, { status: 400 });
  }

  const dir = path.join(process.cwd(), 'public/projects', id);
  fs.mkdirSync(dir, { recursive: true });
  const name = uniqueName(dir, file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-'));
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ src: `/projects/${id}/${name}` });
}

function uniqueName(dir: string, name: string) {
  const { name: stem, ext } = path.parse(name);
  let candidate = name;
  for (let n = 2; fs.existsSync(path.join(dir, candidate)); n++) candidate = `${stem}-${n}${ext}`;
  return candidate;
}
