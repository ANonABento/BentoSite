# CI Performance

The GitHub Actions CI workflow is already split into parallel lint/type-check,
unit-test, and audit jobs. This pass keeps that shape and reduces repeated work
with targeted runtime caches.

## Caches

- `actions/setup-node` continues to cache npm downloads from `package-lock.json`.
- The unit-test job caches `.vitest/cache`, configured through
  `vitest.config.ts`, so repeated Vitest transform work can be restored between
  runs.
- The build job caches `.next/cache`, keyed by the lockfile plus source,
  `public/`, and build configuration inputs. This preserves Next.js compiler and
  fetch caches without uploading the generated `.next` build artifact cache.

Both runtime caches use broad restore keys scoped by OS and package lockfile so
feature branches can reuse a warm cache when exact source hashes do not match.

## Path Filters

The workflow skips `push` and `pull_request` runs when every changed file is
documentation-only:

- `docs/**`
- `**/*.md`

Changes to source files, package files, workflow files, configuration, scripts,
or public assets still run CI.

## Timing Expectations

Cold-cache runs should behave like the previous workflow. Warm-cache PR runs
should spend less time in Vitest transforms and `next build`, with the largest
gain in the build job. The target remains under three minutes per PR for typical
source-only changes; actual timings should be checked from the GitHub Actions
run summary after this branch has at least one warm-cache run.
