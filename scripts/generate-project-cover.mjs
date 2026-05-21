// Generate a deterministic branded cover image for projects that do not have
// real screenshots yet. The image uses only project metadata and is intended
// as honest visual identity, not as a fake product screenshot.

import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { parseArgs, pathExists, printResult, requireString, slugify, usage } from './content-cli-utils.mjs';

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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapWords(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function paletteFor(id) {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return PALETTES[sum % PALETTES.length];
}

function createSvg(project) {
  const [bg, accentA, accentB, fg] = paletteFor(project.id);
  const titleLines = wrapWords(project.name, 18, 3);
  const descLines = wrapWords(project.shortDescription, 58, 3);
  const tech = (project.technologies ?? []).slice(0, 5);
  const category = project.category ?? 'Project';

  const titleSpans = titleLines
    .map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : 72}">${escapeXml(line)}</tspan>`)
    .join('');
  const descSpans = descLines
    .map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : 32}">${escapeXml(line)}</tspan>`)
    .join('');
  const techLabels = tech
    .map((label, index) => {
      const x = 96 + (index % 3) * 250;
      const y = 858 + Math.floor(index / 3) * 56;
      return `
        <rect x="${x}" y="${y}" width="220" height="34" rx="17" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.16)" />
        <text x="${x + 18}" y="${y + 23}" font-family="monospace" font-size="16" fill="${fg}" opacity="0.86">${escapeXml(label)}</text>
      `;
    })
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}" />
      <stop offset="0.58" stop-color="#12100f" />
      <stop offset="1" stop-color="#030304" />
    </linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="${accentA}" stroke-opacity="0.08" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)" />
  <rect width="1600" height="1000" fill="url(#grid)" />
  <path d="M1200 -80 C1390 140 1518 285 1650 540" fill="none" stroke="${accentA}" stroke-width="150" stroke-opacity="0.18" />
  <path d="M1240 1040 C1030 820 920 645 772 396" fill="none" stroke="${accentB}" stroke-width="120" stroke-opacity="0.18" />
  <rect x="72" y="72" width="1456" height="856" rx="28" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.12)" />
  <text x="96" y="136" font-family="monospace" font-size="22" fill="${accentA}" letter-spacing="6">${escapeXml(category.toUpperCase())}</text>
  <text x="96" y="290" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="800" fill="${fg}">${titleSpans}</text>
  <text x="96" y="614" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${fg}" opacity="0.72">${descSpans}</text>
  <text x="96" y="806" font-family="monospace" font-size="18" fill="${accentB}" letter-spacing="4">${escapeXml(project.id)}</text>
  ${techLabels}
  <circle cx="1346" cy="748" r="108" fill="none" stroke="${accentA}" stroke-width="3" stroke-opacity="0.72" />
  <circle cx="1346" cy="748" r="54" fill="none" stroke="${accentB}" stroke-width="3" stroke-opacity="0.72" />
  <path d="M1284 748H1408M1346 686V810" stroke="${fg}" stroke-width="2" stroke-opacity="0.55" />
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
