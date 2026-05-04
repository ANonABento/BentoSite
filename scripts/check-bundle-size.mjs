import { gzipSync } from 'node:zlib';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const CONFIG_PATH = path.resolve(process.cwd(), '.size-limit.json');
const LIGHTHOUSE_CONFIG_PATH = path.resolve(process.cwd(), 'lighthouserc.json');
const rootDir = process.cwd();
const jsonMode = process.argv.includes('--json');
const compareIndex = process.argv.indexOf('--compare');
const allowGrowth = process.argv.includes('--allow-growth');

function getArgValue(name, fallback) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = process.argv.indexOf(name);

  if (index !== -1) {
    const value = process.argv[index + 1];
    return value && !value.startsWith('--') ? value : fallback;
  }

  return fallback;
}

const escapeRegExp = (value) => value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');

function globToRegExp(pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  let regex = '^';

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];
    const afterNext = normalized[index + 2];

    if (char === '*') {
      if (next === '*' && afterNext === '/') {
        regex += '(?:.*/)?';
        index += 2;
      } else if (next === '*') {
        regex += '.*';
        index += 1;
      } else {
        regex += '[^/]*';
      }
      continue;
    }

    regex += escapeRegExp(char);
  }

  return new RegExp(`${regex}$`);
}

function parseLimit(limit) {
  const match = /^([\d.]+)\s*(B|KB|MB)$/i.exec(limit.trim());

  if (!match) {
    throw new Error(`Unsupported size limit format: ${limit}`);
  }

  const [, amount, unit] = match;
  const value = Number.parseFloat(amount);
  const multipliers = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
  };

  return Math.round(value * multipliers[unit.toLowerCase()]);
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${bytes} B`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  return `${value.toFixed(1)}%`;
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function fileSizeBytes(filePath) {
  const content = await fs.readFile(filePath);
  return gzipSync(content).length;
}

function routeToAppManifestKey(route) {
  return route === '/' ? '/page' : `${route}/page`;
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeAssetPath(file) {
  return file.replace(/^\/?_next\//, '').replace(/^\/?\.next\//, '');
}

function routeFromUrl(url) {
  const pathname = new URL(url).pathname.replace(/\/$/, '');
  return pathname || '/';
}

async function readBundleRoutes() {
  const config = await readJson(LIGHTHOUSE_CONFIG_PATH);
  const urls = config.ci?.collect?.url;

  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error(`No Lighthouse URLs found in ${LIGHTHOUSE_CONFIG_PATH}`);
  }

  return unique(urls.map(routeFromUrl));
}

async function readAppRouteFiles(buildDir, route) {
  const manifestPath = path.join(buildDir, 'app-build-manifest.json');
  const key = routeToAppManifestKey(route);

  try {
    const manifest = await readJson(manifestPath);
    const files = manifest.pages?.[key] ?? manifest.pages?.[route] ?? [];

    if (files.length > 0) {
      return files.filter((file) => /\.(js|css)$/.test(file)).map(normalizeAssetPath);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  return readRouteClientReferenceFiles(buildDir, route, key);
}

async function readRouteClientReferenceFiles(buildDir, route, key) {
  const appPathsManifestPath = path.join(buildDir, 'server/app-paths-manifest.json');
  const appPathsManifest = await readJson(appPathsManifestPath);
  const appPath = appPathsManifest[key];

  if (!appPath) {
    throw new Error(`No app path found for route "${route}" in ${appPathsManifestPath}`);
  }

  const clientReferencePath = path.join(
    buildDir,
    'server',
    appPath.replace(/\.js$/, '_client-reference-manifest.js')
  );
  const code = await fs.readFile(clientReferencePath, 'utf8');
  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: clientReferencePath });
  const manifest = context.globalThis.__RSC_MANIFEST?.[key];

  if (!manifest) {
    throw new Error(`No client reference manifest found for route "${route}" in ${clientReferencePath}`);
  }

  const files = [];

  for (const entry of Object.values(manifest.clientModules ?? {})) {
    files.push(...(entry.chunks ?? []));
  }

  for (const entry of Object.values(manifest.entryJSFiles ?? {})) {
    files.push(...entry);
  }

  for (const entry of Object.values(manifest.entryCSSFiles ?? {})) {
    files.push(...entry.map((file) => file.path));
  }

  const bundleFiles = unique(files.map(normalizeAssetPath)).filter((file) => /\.(js|css)$/.test(file));

  if (bundleFiles.length === 0) {
    throw new Error(`No client bundle files found for route "${route}" in ${clientReferencePath}`);
  }

  return bundleFiles;
}

async function calculateRouteSize(buildDir, route) {
  const files = await readAppRouteFiles(buildDir, route);
  let sizeBytes = 0;

  for (const file of unique(files)) {
    sizeBytes += await fileSizeBytes(path.join(buildDir, file));
  }

  return {
    route,
    fileCount: unique(files).length,
    sizeBytes,
    size: formatBytes(sizeBytes),
  };
}

async function runBundleDiff() {
  const baseBuildDirArg = process.argv[compareIndex + 1];

  if (!baseBuildDirArg || baseBuildDirArg.startsWith('--')) {
    throw new Error('Missing base build directory. Usage: check-bundle-size.mjs --compare <base .next> [--head <head .next>]');
  }

  const baseBuildDir = path.resolve(rootDir, baseBuildDirArg);
  const headBuildDir = path.resolve(rootDir, getArgValue('--head', '.next'));
  const maxGrowthPercent = Number.parseFloat(getArgValue('--max-growth-percent', '10'));

  if (!Number.isFinite(maxGrowthPercent) || maxGrowthPercent < 0) {
    throw new Error('--max-growth-percent must be a non-negative number');
  }

  const results = [];

  for (const route of await readBundleRoutes()) {
    const base = await calculateRouteSize(baseBuildDir, route);
    const head = await calculateRouteSize(headBuildDir, route);
    const deltaBytes = head.sizeBytes - base.sizeBytes;
    const deltaPercent = base.sizeBytes === 0 ? Infinity : (deltaBytes / base.sizeBytes) * 100;
    const withinLimit = deltaPercent <= maxGrowthPercent;

    results.push({
      route,
      baseBytes: base.sizeBytes,
      headBytes: head.sizeBytes,
      deltaBytes,
      deltaPercent,
      maxGrowthPercent,
      withinLimit,
      baseSize: base.size,
      headSize: head.size,
      deltaSize: formatBytes(Math.abs(deltaBytes)),
      fileCount: head.fileCount,
    });
  }

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } else {
    process.stdout.write(`Bundle diff gate: hard fail above ${maxGrowthPercent}% route growth\n`);
    process.stdout.write('| Route | Base | Head | Delta | Growth | Status |\n');
    process.stdout.write('|---|---:|---:|---:|---:|---|\n');

    for (const result of results) {
      const sign = result.deltaBytes >= 0 ? '+' : '-';
      const status = result.withinLimit || allowGrowth ? 'PASS' : 'FAIL';
      process.stdout.write(
        `| ${result.route} | ${result.baseSize} | ${result.headSize} | ${sign}${result.deltaSize} | ${formatPercent(result.deltaPercent)} | ${status} |\n`
      );
    }
  }

  const failures = results.filter((result) => !result.withinLimit);

  if (failures.length > 0 && !allowGrowth) {
    process.exitCode = 1;
    return;
  }

  if (failures.length > 0 && allowGrowth) {
    process.stdout.write('\n[allow-bundle-growth] override detected; route growth failures were reported but did not fail CI.\n');
  }
}

async function runAbsoluteSizeCheck() {
  const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
  const files = await walk(rootDir);
  const relativeFiles = files.map((file) => path.relative(rootDir, file).replace(/\\/g, '/'));

  const results = [];

  for (const entry of config) {
    const matcher = globToRegExp(entry.path);
    const matchedFiles = relativeFiles.filter((file) => matcher.test(file));

    if (matchedFiles.length === 0) {
      throw new Error(`No files matched bundle pattern: ${entry.path}`);
    }

    let totalBytes = 0;

    for (const file of matchedFiles) {
      const content = await fs.readFile(path.join(rootDir, file));
      totalBytes += entry.gzip ? gzipSync(content).length : content.length;
    }

    const limitBytes = parseLimit(entry.limit);

    results.push({
      name: entry.name,
      path: entry.path,
      limit: entry.limit,
      matchedFiles: matchedFiles.length,
      sizeBytes: totalBytes,
      withinLimit: totalBytes <= limitBytes,
      size: formatBytes(totalBytes),
    });
  }

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } else {
    for (const result of results) {
      const status = result.withinLimit ? 'PASS' : 'FAIL';
      process.stdout.write(
        `${status} ${result.name}: ${result.size} across ${result.matchedFiles} file(s) (limit ${result.limit})\n`
      );
    }
  }

  if (results.some((result) => !result.withinLimit)) {
    process.exitCode = 1;
  }
}

async function main() {
  if (compareIndex !== -1) {
    await runBundleDiff();
    return;
  }

  await runAbsoluteSizeCheck();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
