import { gzipSync } from 'node:zlib';
import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG_PATH = path.resolve(process.cwd(), '.size-limit.json');
const rootDir = process.cwd();
const jsonMode = process.argv.includes('--json');

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

async function walk(directory) {
  let entries;

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

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

function getStaticPrefix(pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  const wildcardIndex = normalized.search(/[*?[\]{}()]/);
  const prefix = wildcardIndex === -1 ? normalized : normalized.slice(0, wildcardIndex);
  const directoryPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : path.posix.dirname(prefix);

  if (!directoryPrefix || directoryPrefix === '.') return '.';

  return directoryPrefix;
}

async function main() {
  const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));

  const results = [];

  for (const entry of config) {
    const matcher = globToRegExp(entry.path);
    const searchRoot = path.resolve(rootDir, getStaticPrefix(entry.path));
    const files = await walk(searchRoot);
    const relativeFiles = files.map((file) => path.relative(rootDir, file).replace(/\\/g, '/'));
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
    const warnBytes = entry.warn ? parseLimit(entry.warn) : null;
    const withinLimit = totalBytes <= limitBytes;
    const withinWarning = warnBytes === null || totalBytes <= warnBytes;

    results.push({
      name: entry.name,
      path: entry.path,
      limit: entry.limit,
      warn: entry.warn ?? null,
      matchedFiles: matchedFiles.length,
      sizeBytes: totalBytes,
      withinLimit,
      withinWarning,
      size: formatBytes(totalBytes),
    });
  }

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } else {
    for (const result of results) {
      const status = result.withinLimit ? (result.withinWarning ? 'PASS' : 'WARN') : 'FAIL';
      const warnText = result.warn ? `, warn ${result.warn}` : '';
      process.stdout.write(
        `${status} ${result.name}: ${result.size} across ${result.matchedFiles} file(s) (limit ${result.limit}${warnText})\n`
      );
    }
  }

  if (results.some((result) => !result.withinLimit)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
