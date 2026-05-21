// Non-interactive 3D model attacher for existing portfolio projects.
//
// Copies a local .glb/.gltf/.stl into public/models/<project>/ and updates
// src/content/projects/<project>.json links.modelPath. Prefer .glb for GLTF
// assets because external .bin/texture dependencies are otherwise easy to miss.

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { validateProject } from './content-schema.mjs';
import {
  optionalString,
  parseArgs,
  pathExists,
  printResult,
  readJson,
  requireString,
  slugify,
  usage,
  writeJson,
} from './content-cli-utils.mjs';

const ROOT = process.cwd();
const PROJECTS_DIR = path.join(ROOT, 'src', 'content', 'projects');
const MODEL_ASSETS_DIR = path.join(ROOT, 'public', 'models');
const MODEL_EXTS = new Set(['.glb', '.gltf', '.stl']);

function showHelp() {
  usage(`
Usage:
  node scripts/add-model.mjs --project <id> --src <model-file> [options]

Options:
  --name <slug>       Output filename without extension. Defaults to "main".
  --license <file>    Copy a source license file beside the model.
  --source-url <url>  Write SOURCE.md with the model/source URL.
  --overwrite         Replace existing copied model file and project modelPath.
  --sync              Run npm run sync after writing.
  --dry-run           Validate and print the planned result without writing.
  --json              Print machine-readable JSON.

Examples:
  npm run add:model -- --project expressive-ai-robot-head --src ~/Downloads/head.glb --sync
  npm run add:model -- --project pcb-design --src ./exports/board.stl --name board --sync
  npm run add:model -- --project robotic-arm-puppeteer --src ./main.stl --license ./LICENSE --source-url https://github.com/reazon-research/kirigirisu --sync
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

async function copyFile(sourceArg, targetPath, dryRun) {
  const sourcePath = path.resolve(ROOT, sourceArg);
  if (!(await pathExists(sourcePath))) throw new Error(`Model file does not exist: ${sourceArg}`);

  const stat = await fs.stat(sourcePath);
  if (!stat.isFile()) throw new Error(`Model source is not a file: ${sourceArg}`);

  if (!dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }

  return stat.size;
}

async function copyLicense(sourceArg, targetPath, dryRun) {
  const sourcePath = path.resolve(ROOT, sourceArg);
  if (!(await pathExists(sourcePath))) throw new Error(`License file does not exist: ${sourceArg}`);

  const stat = await fs.stat(sourcePath);
  if (!stat.isFile()) throw new Error(`License source is not a file: ${sourceArg}`);

  if (!dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

async function writeSourceFile(targetPath, sourceUrl, licenseFilename, dryRun) {
  if (dryRun) return;

  const lines = [
    '# Model Source',
    '',
    `Source: ${sourceUrl}`,
    ...(licenseFilename ? ['', `License file: \`${licenseFilename}\``] : []),
    '',
  ];

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, lines.join('\n'));
}

async function main() {
  const args = parseArgs();
  if (args.help || args.h) {
    showHelp();
    return;
  }

  const projectId = slugify(requireString(args, 'project'), { maxLength: 60 });
  const source = requireString(args, 'src');
  const outputName = slugify(optionalString(args, 'name') ?? 'main', { maxLength: 48 }) || 'main';
  const license = optionalString(args, 'license');
  const sourceUrl = optionalString(args, 'source-url');
  const dryRun = Boolean(args['dry-run']);
  const overwrite = Boolean(args.overwrite);
  const shouldSync = Boolean(args.sync);
  const json = Boolean(args.json);

  const sourceExt = path.extname(source).toLowerCase();
  if (!MODEL_EXTS.has(sourceExt)) {
    throw new Error('--src must be a .glb, .gltf, or .stl file');
  }

  const projectPath = path.join(PROJECTS_DIR, `${projectId}.json`);
  if (!(await pathExists(projectPath))) {
    throw new Error(`Project does not exist: src/content/projects/${projectId}.json`);
  }

  const project = await readJson(projectPath);
  const modelDir = path.join(MODEL_ASSETS_DIR, projectId);
  const targetPath = path.join(MODEL_ASSETS_DIR, projectId, `${outputName}${sourceExt}`);
  const licensePath = license ? path.join(modelDir, 'LICENSE') : undefined;
  const sourcePath = sourceUrl ? path.join(modelDir, 'SOURCE.md') : undefined;
  const publicModelPath = `/models/${projectId}/${outputName}${sourceExt}`;
  const relativeProjectPath = path.relative(ROOT, projectPath);
  const relativeTargetPath = path.relative(ROOT, targetPath);
  const relativeLicensePath = licensePath ? path.relative(ROOT, licensePath) : undefined;
  const relativeSourcePath = sourcePath ? path.relative(ROOT, sourcePath) : undefined;
  const warnings = [];

  if (!overwrite && (await pathExists(targetPath))) {
    throw new Error(`Refusing to overwrite existing ${relativeTargetPath}. Pass --overwrite if intentional.`);
  }

  if (!overwrite && project.links?.modelPath && project.links.modelPath !== publicModelPath) {
    throw new Error(
      `Project already has links.modelPath=${project.links.modelPath}. Pass --overwrite to replace it.`,
    );
  }

  if (sourceExt === '.gltf') {
    warnings.push('Plain .gltf files may reference external .bin/textures. Prefer exporting a self-contained .glb.');
  }

  const fileSize = await copyFile(source, targetPath, dryRun);
  if (licensePath && license) {
    await copyLicense(license, licensePath, dryRun);
  }
  if (sourcePath && sourceUrl) {
    await writeSourceFile(sourcePath, sourceUrl, licensePath ? path.basename(licensePath) : undefined, dryRun);
  }

  const updatedProject = {
    ...project,
    links: {
      ...(project.links ?? {}),
      modelPath: publicModelPath,
    },
  };

  const errors = validateProject(updatedProject, `${projectId}.json`);
  if (errors.length > 0) {
    throw new Error(`Project is invalid:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  await writeJson(projectPath, updatedProject, { dryRun });

  let syncOutput;
  if (shouldSync && !dryRun) {
    syncOutput = runSync();
  }

  printResult(
    {
      ok: true,
      message: dryRun
        ? `Would attach model to "${project.name ?? projectId}"`
        : `Attached model to "${project.name ?? projectId}"`,
      project: projectId,
      modelPath: publicModelPath,
      fileSize,
      files: [
        relativeProjectPath,
        relativeTargetPath,
        ...(relativeLicensePath ? [relativeLicensePath] : []),
        ...(relativeSourcePath ? [relativeSourcePath] : []),
        ...(shouldSync ? ['src/content/projects.generated.json'] : []),
      ],
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
