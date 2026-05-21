// Production-readiness audit for content completeness.
//
// Unlike validate-assets, this reports launch gaps without failing by default.
// Use --strict when you want missing launch assets to fail a release.

import fs from 'node:fs/promises';
import path from 'node:path';
import { auditLaunchContent } from './launch-audit-core.mjs';

const ROOT = process.cwd();
const PROJECTS_PATH = path.join(ROOT, 'src', 'content', 'projects.generated.json');
const PHOTOS_MANIFEST_PATH = path.join(ROOT, 'public', 'photos', 'manifest.json');
const TALKING_POINTS_PATH = path.join(ROOT, 'src', 'content', 'talking-points.generated.json');

function printSection(title, items) {
  console.log(`\n${title}`);
  if (items.length === 0) {
    console.log('- none');
    return;
  }
  for (const item of items) console.log(`- ${item}`);
}

function printAssetCommands(commands) {
  if (commands.length === 0) return;

  console.log('\nCommands to close asset gaps');
  for (const command of commands) console.log(`- ${command}`);
}

async function main() {
  const json = process.argv.includes('--json');
  const strict = process.argv.includes('--strict');
  const projectsContent = JSON.parse(await fs.readFile(PROJECTS_PATH, 'utf8'));
  const photoManifest = JSON.parse(await fs.readFile(PHOTOS_MANIFEST_PATH, 'utf8'));
  const talkingPointsContent = JSON.parse(await fs.readFile(TALKING_POINTS_PATH, 'utf8'));
  const audit = auditLaunchContent({ projectsContent, photoManifest, talkingPointsContent });

  if (json) {
    console.log(JSON.stringify(audit, null, 2));
    if (strict && audit.blockingCount > 0) {
      process.exitCode = 1;
    }
    return;
  }

  console.log('Launch content audit');
  console.log(`Projects: ${audit.counts.projects}`);
  console.log(`Photos: ${audit.counts.photos}`);
  console.log(`Talking points: ${audit.counts.talkingPoints}`);

  for (const finding of audit.findings) printSection(finding.title, finding.items);

  printSection('Global launch gaps needing Kevin/assets', audit.globalGaps);
  printAssetCommands(audit.commands);

  if (strict && audit.blockingCount > 0) {
    console.error(`\nStrict launch audit failed with ${audit.blockingCount} launch gap(s).`);
    process.exitCode = 1;
    return;
  }

  console.log('\nLaunch audit complete.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
