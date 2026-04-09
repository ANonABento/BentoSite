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

async function main() {
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
