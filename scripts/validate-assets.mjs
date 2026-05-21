// Validate content references that can break production rendering.
//
// This is intentionally stricter for dangling local paths than for content
// completeness. Missing optional hero images belong in launch-audit; a JSON
// file pointing at a nonexistent /projects/... asset should fail CI.

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PROJECTS_PATH = path.join(ROOT, 'src', 'content', 'projects.generated.json');
const PHOTOS_MANIFEST_PATH = path.join(ROOT, 'public', 'photos', 'manifest.json');
const MODEL_EXTS = new Set(['.glb', '.gltf', '.stl']);

function isLocalPublicPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

function publicPathToFile(value, root = ROOT) {
  return path.join(root, 'public', value.replace(/^\/+/, ''));
}

async function exists(value) {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

async function validateLocalPath(value, label, errors, root = ROOT) {
  if (!isLocalPublicPath(value)) return;
  const target = publicPathToFile(value, root);
  if (!await exists(target)) {
    errors.push(`${label}: missing public asset ${value}`);
  }
}

async function validateModelAsset(value, label, errors, warnings, root = ROOT) {
  if (!value) return;

  const ext = path.extname(value).toLowerCase();
  if (!MODEL_EXTS.has(ext)) {
    errors.push(`${label}: modelPath must point to a .glb, .gltf, or .stl file (${value})`);
  }

  await validateLocalPath(value, label, errors, root);
  if (!isLocalPublicPath(value) || !value.startsWith('/models/')) return;

  const modelFile = publicPathToFile(value, root);
  const modelDir = path.dirname(modelFile);
  const sourcePath = path.join(modelDir, 'SOURCE.md');
  const licensePath = path.join(modelDir, 'LICENSE');

  if (!await exists(sourcePath)) {
      errors.push(`${label}: missing model source note /${path.relative(path.join(root, 'public'), sourcePath)}`);
  } else {
    const sourceText = await fs.readFile(sourcePath, 'utf8');
    if (!/source:/i.test(sourceText) || sourceText.trim().length < 20) {
      errors.push(`${label}: SOURCE.md must include a non-empty Source: entry`);
    }
  }

  if (!await exists(licensePath)) {
    warnings.push(`${label}: no LICENSE file found beside model; confirm this is Kevin-owned or add upstream license text`);
  }
}

function validateHttps(value, label, warnings) {
  if (!value || isLocalPublicPath(value)) return;
  if (!/^https:\/\//i.test(value)) {
    warnings.push(`${label}: non-HTTPS URL may fail in production (${value})`);
  }
}

export async function validateAssets({ projects, photos, root = ROOT }) {
  const errors = [];
  const warnings = [];

  for (const project of projects) {
    const prefix = `project ${project.id}`;
    await validateLocalPath(project.thumbnail, `${prefix}.thumbnail`, errors, root);
    await validateModelAsset(project.links?.modelPath, `${prefix}.links.modelPath`, errors, warnings, root);
    await validateLocalPath(project.media?.featuredImage, `${prefix}.media.featuredImage`, errors, root);
    await validateLocalPath(project.media?.pdf, `${prefix}.media.pdf`, errors, root);
    await validateLocalPath(project.media?.video, `${prefix}.media.video`, errors, root);

    for (const [index, image] of (project.media?.images ?? []).entries()) {
      await validateLocalPath(image, `${prefix}.media.images[${index}]`, errors, root);
    }

    validateHttps(project.links?.github, `${prefix}.links.github`, warnings);
    validateHttps(project.links?.liveDemo, `${prefix}.links.liveDemo`, warnings);
    validateHttps(project.links?.docs, `${prefix}.links.docs`, warnings);
    validateHttps(project.media?.website, `${prefix}.media.website`, warnings);
    validateHttps(project.media?.video, `${prefix}.media.video`, warnings);
    validateHttps(project.media?.game?.url, `${prefix}.media.game.url`, warnings);

    if (project.media?.game?.type === 'itch' && project.media.game.url && !/\/embed\//.test(project.media.game.url)) {
      warnings.push(`${prefix}.media.game.url: itch URL is not an embed URL; viewer will use the external-link fallback`);
    }
  }

  for (const photo of photos) {
    await validateLocalPath(photo.src, `photo ${photo.id}.src`, errors, root);
    for (const key of ['title', 'location', 'year', 'alt']) {
      if (typeof photo[key] !== 'string' || photo[key].trim().length === 0) {
        errors.push(`photo ${photo.id}.${key}: expected a non-empty string`);
      }
    }
    if (!Number.isFinite(photo.width) || !Number.isFinite(photo.height)) {
      errors.push(`photo ${photo.id}: missing numeric width/height`);
    }
  }

  return { errors, warnings };
}

async function main() {
  const projectsContent = JSON.parse(await fs.readFile(PROJECTS_PATH, 'utf8'));
  const photoManifest = JSON.parse(await fs.readFile(PHOTOS_MANIFEST_PATH, 'utf8'));
  const projects = projectsContent.projects ?? [];
  const photos = photoManifest.photos ?? [];
  const { errors, warnings } = await validateAssets({ projects, photos });

  for (const warning of warnings) console.warn(`Warning: ${warning}`);

  if (errors.length > 0) {
    console.error('Asset validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Asset validation passed for ${projects.length} projects and ${photos.length} photos.`);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
