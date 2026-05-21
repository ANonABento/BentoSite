// Writes a durable markdown handoff for Kevin-owned launch assets.

import fs from 'node:fs/promises';
import path from 'node:path';
import { auditLaunchContent, renderAssetRequestsMarkdown } from './launch-audit-core.mjs';

const ROOT = process.cwd();
const PROJECTS_PATH = path.join(ROOT, 'src', 'content', 'projects.generated.json');
const PHOTOS_MANIFEST_PATH = path.join(ROOT, 'public', 'photos', 'manifest.json');
const TALKING_POINTS_PATH = path.join(ROOT, 'src', 'content', 'talking-points.generated.json');
const DEFAULT_OUTPUT_PATH = path.join(ROOT, 'docs', 'launch-asset-requests.md');

function readArg(name) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index !== -1) return process.argv[index + 1];

  return undefined;
}

async function main() {
  const check = process.argv.includes('--check');
  const outputPath = path.resolve(ROOT, readArg('--output') ?? DEFAULT_OUTPUT_PATH);
  const generatedAt = readArg('--generated-at');
  const projectsContent = JSON.parse(await fs.readFile(PROJECTS_PATH, 'utf8'));
  const photoManifest = JSON.parse(await fs.readFile(PHOTOS_MANIFEST_PATH, 'utf8'));
  const talkingPointsContent = JSON.parse(await fs.readFile(TALKING_POINTS_PATH, 'utf8'));
  const audit = auditLaunchContent({ projectsContent, photoManifest, talkingPointsContent });
  const report = renderAssetRequestsMarkdown(audit, generatedAt ? { generatedAt } : undefined);

  if (check) {
    const existing = await fs.readFile(outputPath, 'utf8').catch(() => null);
    if (existing !== report) {
      console.error(`${path.relative(ROOT, outputPath)} is out of date. Run npm run launch:assets:report.`);
      process.exitCode = 1;
    }
    return;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, report);
  console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
