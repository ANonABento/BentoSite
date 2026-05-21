// Non-interactive project content writer for Choomfie / Discord workflows.
//
// This intentionally covers the common "I have the project facts/assets"
// path. Repo/Devpost scraping remains an agent task, but the final write is a
// deterministic command with validation and optional asset copying.

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import sharp from 'sharp';

import { validateProject } from './content-schema.mjs';
import {
  optionalString,
  parseArgs,
  parseStringList,
  pathExists,
  printResult,
  requireString,
  slugify,
  usage,
  writeJson,
} from './content-cli-utils.mjs';

const ROOT = process.cwd();
const PROJECTS_DIR = path.join(ROOT, 'src', 'content', 'projects');
const PROJECT_ASSETS_DIR = path.join(ROOT, 'public', 'projects');
const MODEL_ASSETS_DIR = path.join(ROOT, 'public', 'models');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MODEL_EXTS = new Set(['.glb', '.gltf', '.stl']);

function showHelp() {
  usage(`
Usage:
  node scripts/add-project.mjs --name <name> --short-description <text> --category <category> --status <status> --technologies <csv> --date <yyyy-mm> [options]

Options:
  --id <slug>              Project id. Defaults to name slug.
  --description <text>     Longer project modal/chat context.
  --featured               Mark as featured.
  --github <url>           GitHub URL.
  --demo <url>             Live demo URL.
  --docs <url>             Docs/Devpost URL.
  --hero <path>            Local image to copy to public/projects/<id>/hero.<ext>.
  --image <path>           Extra local image. May be comma-separated for several images.
  --model <path>           Local .glb/.gltf/.stl copied to public/models/<id>/main.<ext>.
  --video <url-or-path>    YouTube/Vimeo URL or local .mp4.
  --pdf <path>             Local PDF copied to public/projects/<id>/<filename>.
  --website <url>          Embeddable HTTPS website URL.
  --game-url <url>         itch/Unity URL.
  --game-type <type>       itch or unity-webgl. Required with --game-url.
  --overwrite              Replace an existing project with the same id.
  --sync                   Run npm run sync after writing.
  --dry-run                Validate and print the planned result without writing.
  --json                   Print machine-readable JSON.
`);
}

function runSync() {
  const result = spawnSync('npm', ['run', 'sync'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`sync failed${detail ? `:\n${detail}` : ''}`);
  }

  return [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
}

function normalizeImageExt(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  return ext === '.jpeg' ? '.jpg' : ext;
}

async function copyImage(sourceArg, targetPath, dryRun) {
  const sourcePath = path.resolve(ROOT, sourceArg);
  if (!(await pathExists(sourcePath))) throw new Error(`Image does not exist: ${sourceArg}`);

  const ext = normalizeImageExt(sourcePath);
  if (!IMAGE_EXTS.has(ext)) throw new Error(`Unsupported image extension "${ext}" for ${sourceArg}`);

  const metadata = await sharp(sourcePath, { failOn: 'warning' }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Could not read image dimensions from ${sourceArg}`);

  if (!dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await sharp(sourcePath, { failOn: 'warning' })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .toFile(targetPath);
  }

  return { width: metadata.width, height: metadata.height };
}

async function copyFile(sourceArg, targetPath, dryRun) {
  const sourcePath = path.resolve(ROOT, sourceArg);
  if (!(await pathExists(sourcePath))) throw new Error(`File does not exist: ${sourceArg}`);
  if (!dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

function assertHttpsUrl(value, label) {
  if (!value) return;
  if (!/^https:\/\//i.test(value)) {
    throw new Error(`${label} must be an HTTPS URL`);
  }
}

async function main() {
  const args = parseArgs();
  if (args.help || args.h) {
    showHelp();
    return;
  }

  const name = requireString(args, 'name');
  const id = slugify(optionalString(args, 'id') ?? name, { maxLength: 60 });
  const shortDescription = requireString(args, 'short-description');
  const category = requireString(args, 'category');
  const status = requireString(args, 'status');
  const technologies = parseStringList(requireString(args, 'technologies'));
  const dateCompleted = requireString(args, 'date');
  const description = optionalString(args, 'description');
  const dryRun = Boolean(args['dry-run']);
  const overwrite = Boolean(args.overwrite);
  const shouldSync = Boolean(args.sync);
  const json = Boolean(args.json);

  if (!id) throw new Error('Could not derive a valid project id');
  if (technologies.length === 0) throw new Error('--technologies must contain at least one comma-separated technology');

  const target = path.join(PROJECTS_DIR, `${id}.json`);
  const relativeTarget = path.relative(ROOT, target);
  if (!overwrite && await pathExists(target)) {
    throw new Error(`Refusing to overwrite existing ${relativeTarget}. Pass --overwrite if intentional.`);
  }

  const links = {};
  const github = optionalString(args, 'github');
  const demo = optionalString(args, 'demo');
  const docs = optionalString(args, 'docs');
  if (github) links.github = github;
  if (demo) links.liveDemo = demo;
  if (docs) links.docs = docs;
  for (const [label, value] of Object.entries({ github, demo, docs })) assertHttpsUrl(value, `--${label}`);

  const media = {};
  const files = [];
  const warnings = [];
  const projectAssetDir = path.join(PROJECT_ASSETS_DIR, id);
  const modelAssetDir = path.join(MODEL_ASSETS_DIR, id);

  const hero = optionalString(args, 'hero');
  if (hero) {
    const ext = normalizeImageExt(hero);
    const target = path.join(projectAssetDir, `hero${ext}`);
    await copyImage(hero, target, dryRun);
    media.featuredImage = `/projects/${id}/hero${ext}`;
    files.push(path.relative(ROOT, target));
  }

  const extraImages = parseStringList(optionalString(args, 'image'));
  if (extraImages.length > 0) {
    media.images = [];
    for (let index = 0; index < extraImages.length; index += 1) {
      const source = extraImages[index];
      const ext = normalizeImageExt(source);
      const targetName = `image-${String(index + 1).padStart(2, '0')}${ext}`;
      const target = path.join(projectAssetDir, targetName);
      await copyImage(source, target, dryRun);
      media.images.push(`/projects/${id}/${targetName}`);
      files.push(path.relative(ROOT, target));
    }
  }

  const model = optionalString(args, 'model');
  if (model) {
    const ext = path.extname(model).toLowerCase();
    if (!MODEL_EXTS.has(ext)) throw new Error('--model must be a .glb, .gltf, or .stl file');
    const target = path.join(modelAssetDir, `main${ext}`);
    await copyFile(model, target, dryRun);
    links.modelPath = `/models/${id}/main${ext}`;
    files.push(path.relative(ROOT, target));
  }

  const video = optionalString(args, 'video');
  if (video) {
    if (/^https:\/\//i.test(video)) {
      media.video = video;
    } else {
      const sourcePath = path.resolve(ROOT, video);
      if (path.extname(sourcePath).toLowerCase() !== '.mp4') throw new Error('--video local files must be .mp4');
      const target = path.join(projectAssetDir, 'video.mp4');
      await copyFile(video, target, dryRun);
      media.video = `/projects/${id}/video.mp4`;
      files.push(path.relative(ROOT, target));
    }
  }

  const pdf = optionalString(args, 'pdf');
  if (pdf) {
    if (path.extname(pdf).toLowerCase() !== '.pdf') throw new Error('--pdf must be a local PDF file');
    const targetName = `${slugify(path.basename(pdf, path.extname(pdf)), { maxLength: 40 }) || 'document'}.pdf`;
    const target = path.join(projectAssetDir, targetName);
    await copyFile(pdf, target, dryRun);
    media.pdf = `/projects/${id}/${targetName}`;
    files.push(path.relative(ROOT, target));
  }

  const website = optionalString(args, 'website');
  if (website) {
    assertHttpsUrl(website, '--website');
    media.website = website;
  }

  const gameUrl = optionalString(args, 'game-url');
  const gameType = optionalString(args, 'game-type');
  if (gameUrl || gameType) {
    if (!gameUrl || !gameType) throw new Error('--game-url and --game-type must be provided together');
    assertHttpsUrl(gameUrl, '--game-url');
    if (!['itch', 'unity-webgl'].includes(gameType)) throw new Error('--game-type must be itch or unity-webgl');
    if (gameType === 'itch' && !/\/embed\//.test(gameUrl)) {
      warnings.push('itch.io URL is not an /embed/ URL; GameViewer will show an open-in-new-tab CTA.');
    }
    media.game = { type: gameType, url: gameUrl };
  }

  const project = {
    id,
    name,
    shortDescription,
    ...(description ? { description } : {}),
    category,
    status,
    technologies: Array.from(new Set(technologies)).slice(0, 12),
    ...(Object.keys(links).length > 0 ? { links } : {}),
    ...(Object.keys(media).length > 0 ? { media } : {}),
    ...(args.featured ? { featured: true } : { featured: false }),
    dateCompleted,
  };

  const errors = validateProject(project, `${id}.json`);
  if (errors.length > 0) {
    throw new Error(`Project is invalid:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  await writeJson(target, project, { dryRun });
  files.unshift(relativeTarget);

  let syncOutput;
  if (shouldSync && !dryRun) {
    syncOutput = runSync();
  }

  printResult(
    {
      ok: true,
      message: dryRun ? `Would add project "${name}"` : `Added project "${name}"`,
      id,
      project,
      files: [...files, ...(shouldSync ? ['src/content/projects.generated.json'] : [])],
      warnings,
      syncOutput,
      next: shouldSync ? ['Run npm test before committing.'] : ['Run npm run sync', 'Run npm test'],
    },
    { json },
  );
}

main().catch((error) => {
  const args = parseArgs();
  if (args.json) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
});
