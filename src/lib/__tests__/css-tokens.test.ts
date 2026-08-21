/**
 * @vitest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A `var(--token)` that is never defined is not a visible error — the browser
 * drops the whole declaration and renders the element unstyled. That is how the
 * 404 page shipped a button with white text on no background at all, and how
 * the project card's status badge lost its tint: `--primary*`, `--success*`,
 * and `--muted-foreground` were referenced but defined nowhere.
 *
 * This test reads the same thing the browser does.
 */

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(REPO_ROOT, 'src');

/**
 * Injected at runtime by `next/font`, which writes them onto the html element
 * rather than into any stylesheet we can read here.
 */
const RUNTIME_DEFINED = new Set([
  '--font-geist-sans',
  '--font-geist-mono',
  '--font-orbitron',
  '--font-pixel',
  '--font-crt',
  '--font-dot',
]);

function walk(dir: string, extensions: string[], found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, extensions, found);
    else if (extensions.some((extension) => entry.name.endsWith(extension))) found.push(full);
  }
  return found;
}

const cssFiles = walk(SRC, ['.css']);
// Test sources are excluded: they are not shipped styling, and prose about
// `var(--x)` in a comment is not a reference the browser will ever resolve.
const codeFiles = walk(SRC, ['.ts', '.tsx']).filter(
  (file) => !/\.test\.tsx?$/.test(file) && !file.includes(`${path.sep}__tests__${path.sep}`),
);

function definedTokens(): Set<string> {
  const defined = new Set(RUNTIME_DEFINED);
  for (const file of cssFiles) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
      defined.add(match[1]);
    }
  }
  return defined;
}

interface Reference {
  token: string;
  file: string;
}

function referencedTokens(): Reference[] {
  const references: Reference[] = [];
  for (const file of [...codeFiles, ...cssFiles]) {
    const source = fs.readFileSync(file, 'utf8');
    // `var(--x, fallback)` is deliberate optional styling — the fallback is the
    // definition. Only bare `var(--x)` can silently drop a declaration.
    for (const match of source.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*([,)])/g)) {
      if (match[2] === ')') {
        references.push({ token: match[1], file: path.relative(REPO_ROOT, file) });
      }
    }
  }
  return references;
}

describe('CSS custom properties', () => {
  it('defines every token the app references without a fallback', () => {
    const defined = definedTokens();
    const missing = referencedTokens().filter(({ token }) => !defined.has(token));

    const report = [...new Set(missing.map(({ token, file }) => `${token} (${file})`))].sort();
    expect(report).toEqual([]);
  });

  it('honours the accent contract documented in CLAUDE.md', () => {
    const defined = definedTokens();
    // --primary for generic CTAs, --ai for AI-facing UI. Both were documented
    // for months while resolving to nothing.
    for (const token of ['--primary', '--primary-hover', '--primary-active', '--primary-muted', '--ai']) {
      expect(defined.has(token)).toBe(true);
    }
  });
});
