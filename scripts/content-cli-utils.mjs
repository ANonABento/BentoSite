import fs from 'node:fs/promises';
import path from 'node:path';

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    _: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const withoutPrefix = token.slice(2);
    const equalsIndex = withoutPrefix.indexOf('=');

    if (equalsIndex >= 0) {
      const key = withoutPrefix.slice(0, equalsIndex);
      const value = withoutPrefix.slice(equalsIndex + 1);
      args[key] = coerceArgValue(value);
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[withoutPrefix] = true;
      continue;
    }

    args[withoutPrefix] = coerceArgValue(next);
    index += 1;
  }

  return args;
}

function coerceArgValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export function slugify(value, { maxLength = 50 } = {}) {
  const slug = String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (slug.length <= maxLength) return slug;
  return slug
    .slice(0, maxLength)
    .replace(/-[^-]*$/, '')
    .replace(/^-+|-+$/g, '') || slug.slice(0, maxLength);
}

export function requireString(args, key) {
  const value = args[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required --${key}`);
  }
  return value.trim();
}

export function optionalString(args, key) {
  const value = args[key];
  if (value === undefined || value === null || value === false) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;
  return value.trim();
}

export function parseStringList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(target) {
  const raw = await fs.readFile(target, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${path.relative(process.cwd(), target)}: invalid JSON - ${error.message}`);
  }
}

export async function writeJson(target, data, { dryRun = false } = {}) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (!dryRun) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, text, 'utf8');
  }
  return text;
}

export function printResult(payload, { json = false } = {}) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (payload.message) console.log(payload.message);
  if (payload.files?.length) {
    console.log('Files:');
    for (const file of payload.files) console.log(`- ${file}`);
  }
  if (payload.next?.length) {
    console.log('Next:');
    for (const item of payload.next) console.log(`- ${item}`);
  }
  if (payload.warnings?.length) {
    console.warn('Warnings:');
    for (const warning of payload.warnings) console.warn(`- ${warning}`);
  }
}

export function usage(text) {
  console.log(text.trim());
}
