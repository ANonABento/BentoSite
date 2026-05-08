import fs from 'node:fs/promises';
import path from 'node:path';

import { validatePortfolioPayload } from './portfolio-sync-schema.mjs';

const DEFAULT_PORTFOLIO_PATH = path.join(process.cwd(), 'src', 'content', 'portfolio.json');

async function main() {
  const target = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_PORTFOLIO_PATH;
  const raw = await fs.readFile(target, 'utf8');
  const payload = JSON.parse(raw);
  const result = validatePortfolioPayload(payload);

  if (!result.valid) {
    console.error('Portfolio schema validation failed:');
    for (const message of result.errors) {
      console.error(`- ${message}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(`Portfolio schema validation passed for ${target}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

