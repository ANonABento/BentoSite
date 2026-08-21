// Production-readiness audit for content completeness.
//
// Unlike validate-assets, this reports launch gaps without failing by default.
// Use --strict when you want missing launch assets to fail a release.

import fs from 'node:fs/promises';
import path from 'node:path';
import { auditLaunchContent } from './launch-audit-core.mjs';
import { readGeneratedCovers, scanPlaceholderPhotos } from './detect-placeholder-images.mjs';

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

  // Imagery checks live here rather than in launch-audit-core so the core stays
  // a pure function over JSON. These need pixels and the filesystem.
  const { photos: placeholderPhotos } = await scanPlaceholderPhotos();
  const generatedCovers = await readGeneratedCovers();

  if (json) {
    console.log(JSON.stringify({ ...audit, placeholderPhotos, generatedCovers }, null, 2));
    if (strict && audit.blockingCount + placeholderPhotos.length + generatedCovers.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  console.log('Launch content audit');
  console.log(`Projects: ${audit.counts.projects}`);
  console.log(`Photos: ${audit.counts.photos}`);
  console.log(`Talking points: ${audit.counts.talkingPoints}`);

  for (const finding of audit.findings) printSection(finding.title, finding.items);

  printSection(
    'Photos that are generated placeholder art, not photographs',
    placeholderPhotos.map(
      (photo) => `${photo.file} (only ${photo.colors} distinct colours — replace or remove)`,
    ),
  );
  printSection(
    'Projects still showing a generated cover instead of a real capture',
    generatedCovers.map((cover) => `${cover.projectId} (${cover.file})`),
  );

  printSection('Global launch gaps needing Kevin/assets', audit.globalGaps);
  printAssetCommands(audit.commands);

  const imageryGaps = placeholderPhotos.length + generatedCovers.length;
  if (strict && audit.blockingCount + imageryGaps > 0) {
    console.error(
      `\nStrict launch audit failed with ${audit.blockingCount + imageryGaps} launch gap(s).`,
    );
    process.exitCode = 1;
    return;
  }

  console.log('\nLaunch audit complete.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
