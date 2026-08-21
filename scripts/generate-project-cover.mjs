// Generate a deterministic branded cover image for projects that do not have
// real screenshots yet. The image is abstract on purpose: the card overlay
// already renders the name, category, description, and tech badges, so baking
// that text into the artwork made every card read its own title twice. Palette
// and geometry are both derived from the project id, so two covers sitting
// side by side in the grid do not look like the same template.

import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { parseArgs, pathExists, printResult, requireString, slugify, usage } from './content-cli-utils.mjs';
import { recordGeneratedCover } from './detect-placeholder-images.mjs';

const ROOT = process.cwd();
const PROJECTS_DIR = path.join(ROOT, 'src', 'content', 'projects');
const PROJECT_ASSETS_DIR = path.join(ROOT, 'public', 'projects');

const PALETTES = [
  ['#050507', '#E07B3C', '#A78BFA', '#F5F1E8'],
  ['#070809', '#38BDF8', '#E07B3C', '#F7F7F2'],
  ['#080606', '#F59E0B', '#A78BFA', '#F8FAFC'],
  ['#05060A', '#A78BFA', '#22C55E', '#F4F4F5'],
];

function showHelp() {
  usage(`
Usage:
  node scripts/generate-project-cover.mjs --project <id> [options]

Options:
  --out <path>      Output path. Default: public/projects/<id>/hero.png
  --overwrite       Replace an existing output file.
  --json            Print machine-readable JSON.
`);
}

function hashOf(id) {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }
  return hash;
}

function paletteFor(id) {
  return PALETTES[hashOf(id) % PALETTES.length];
}

function createSvg(project) {
  const [bg, accentA, accentB] = paletteFor(project.id);
  const hash = hashOf(project.id);

  // Every geometric value is derived from the id so covers differ from each
  // other while staying stable across regenerations.
  const sweepX = 900 + (hash % 7) * 90;
  const sweepWidth = 110 + (hash % 5) * 22;
  const counterY = 300 + ((hash >> 3) % 6) * 90;
  const reticleX = 1180 + ((hash >> 5) % 5) * 60;
  const reticleY = 300 + ((hash >> 7) % 5) * 90;
  const reticleR = 88 + ((hash >> 2) % 4) * 18;
  const gridSize = 48 + (hash % 4) * 16;
  const tilt = -24 + (hash % 5) * 12;

  const scanLines = Array.from({ length: 5 }, (_, index) => {
    const y = 200 + index * 150 + ((hash >> index) % 40);
    const width = 180 + ((hash >> (index + 1)) % 6) * 90;
    const x = 140 + ((hash >> (index + 2)) % 7) * 120;
    return `<path d="M${x} ${y}H${x + width}" stroke="${index % 2 === 0 ? accentA : accentB}" stroke-width="2" stroke-opacity="0.22" />`;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}" />
      <stop offset="0.58" stop-color="#12100f" />
      <stop offset="1" stop-color="#030304" />
    </linearGradient>
    <pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">
      <path d="M${gridSize} 0H0V${gridSize}" fill="none" stroke="${accentA}" stroke-opacity="0.08" stroke-width="1" />
    </pattern>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${accentA}" stop-opacity="0.28" />
      <stop offset="1" stop-color="${accentA}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)" />
  <rect width="1600" height="1000" fill="url(#grid)" />
  <g transform="rotate(${tilt} 800 500)">
    <path d="M${sweepX} -120 C${sweepX + 190} 140 ${sweepX + 318} 285 ${sweepX + 450} 540" fill="none" stroke="${accentA}" stroke-width="${sweepWidth}" stroke-opacity="0.2" />
    <path d="M${sweepX - 40} 1120 C${sweepX - 250} 900 ${sweepX - 360} ${counterY + 320} ${sweepX - 508} ${counterY}" fill="none" stroke="${accentB}" stroke-width="${sweepWidth - 30}" stroke-opacity="0.18" />
  </g>
  <rect x="72" y="72" width="1456" height="856" rx="28" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.12)" />
  <circle cx="${reticleX}" cy="${reticleY}" r="${reticleR * 3}" fill="url(#glow)" />
  ${scanLines}
  <path d="M120 120H236M120 120V236" fill="none" stroke="${accentA}" stroke-width="4" stroke-opacity="0.55" />
  <path d="M1480 880H1364M1480 880V764" fill="none" stroke="${accentB}" stroke-width="4" stroke-opacity="0.55" />
  <circle cx="${reticleX}" cy="${reticleY}" r="${reticleR}" fill="none" stroke="${accentA}" stroke-width="3" stroke-opacity="0.72" />
  <circle cx="${reticleX}" cy="${reticleY}" r="${Math.round(reticleR / 2)}" fill="none" stroke="${accentB}" stroke-width="3" stroke-opacity="0.72" />
  <path d="M${reticleX - reticleR - 16} ${reticleY}H${reticleX + reticleR + 16}M${reticleX} ${reticleY - reticleR - 16}V${reticleY + reticleR + 16}" stroke="${accentA}" stroke-width="2" stroke-opacity="0.4" />
</svg>`;
}

async function main() {
  const args = parseArgs();
  if (args.help || args.h) {
    showHelp();
    return;
  }

  const projectId = requireString(args, 'project');
  const projectPath = path.join(PROJECTS_DIR, `${projectId}.json`);
  if (!await pathExists(projectPath)) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const project = JSON.parse(await fs.readFile(projectPath, 'utf8'));
  const outArg = args.out ? String(args.out) : path.join(PROJECT_ASSETS_DIR, projectId, 'hero.png');
  const outputPath = path.resolve(ROOT, outArg);
  const relativeOutput = path.relative(ROOT, outputPath);

  if (!args.overwrite && await pathExists(outputPath)) {
    throw new Error(`Refusing to overwrite existing ${relativeOutput}. Pass --overwrite if intentional.`);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(createSvg(project))).png().toFile(outputPath);
  // Record it so `npm run launch:audit` can report which projects are still
  // showing generated art instead of a real capture.
  await recordGeneratedCover(projectId, outputPath);

  printResult(
    {
      ok: true,
      message: `Generated cover for ${project.name}`,
      project: projectId,
      files: [relativeOutput],
    },
    { json: Boolean(args.json) },
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
