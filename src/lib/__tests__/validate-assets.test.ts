import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type ValidateAssetsModule = {
  validateAssets: (input: {
    photos: Array<Record<string, unknown>>;
    projects: Array<Record<string, unknown>>;
    root: string;
  }) => Promise<{ errors: string[]; warnings: string[] }>;
};

async function loadValidateAssetsModule(): Promise<ValidateAssetsModule> {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'scripts/validate-assets.mjs')).href;
  return import(moduleUrl) as Promise<ValidateAssetsModule>;
}

async function makeTempRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'bentosite-assets-'));
}

function projectWithModel(modelPath: string) {
  return {
    id: 'robotic-arm-puppeteer',
    links: { modelPath },
    media: {},
  };
}

describe('validate assets', () => {
  it('fails project model assets without SOURCE.md provenance', async () => {
    const { validateAssets } = await loadValidateAssetsModule();
    const root = await makeTempRoot();
    await fs.mkdir(path.join(root, 'public/models/robotic-arm-puppeteer'), { recursive: true });
    await fs.writeFile(path.join(root, 'public/models/robotic-arm-puppeteer/main.stl'), 'solid test\nendsolid test\n');

    const result = await validateAssets({
      photos: [],
      projects: [projectWithModel('/models/robotic-arm-puppeteer/main.stl')],
      root,
    });

    expect(result.errors).toContain(
      'project robotic-arm-puppeteer.links.modelPath: missing model source note /models/robotic-arm-puppeteer/SOURCE.md',
    );
  });

  it('accepts project model assets with SOURCE.md and a colocated license', async () => {
    const { validateAssets } = await loadValidateAssetsModule();
    const root = await makeTempRoot();
    const modelDir = path.join(root, 'public/models/robotic-arm-puppeteer');
    await fs.mkdir(modelDir, { recursive: true });
    await fs.writeFile(path.join(modelDir, 'main.stl'), 'solid test\nendsolid test\n');
    await fs.writeFile(path.join(modelDir, 'SOURCE.md'), '# Model Source\n\nSource: https://example.com/source\n');
    await fs.writeFile(path.join(modelDir, 'LICENSE'), 'Example license text\n');

    const result = await validateAssets({
      photos: [],
      projects: [projectWithModel('/models/robotic-arm-puppeteer/main.stl')],
      root,
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
