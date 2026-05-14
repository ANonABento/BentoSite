# Goal: Behavior-Preserving Refactor And Codebase Cleanup

Use this goal for careful, incremental cleanup work in any software project. It is intentionally project-agnostic: local repository instructions, framework conventions, commands, and verification requirements must be discovered before making changes.

## Mission

Refactor and clean the codebase without changing user-visible behavior unless the user explicitly requests a behavior change. Improve maintainability through small, reviewable changes backed by verification.

## First Pass: Understand The Repository

Before editing, read the local instructions and project entry points:

- Root and nested agent instruction files, such as `AGENTS.md`, `CLAUDE.md`, or equivalent.
- `README` files, contribution docs, architecture docs, and active goal/task docs.
- Package, build, runtime, lint, test, typecheck, and deployment configuration.
- Main source directories, route or entrypoint files, shared utilities, styling/theme files, and content/data directories.

Identify and record:

- Framework, runtime, routing model, rendering model, and deployment assumptions.
- Styling system, design tokens, theme rules, asset handling, and generated files.
- State and data flow, persistence boundaries, API contracts, environment variables, and public routes.
- Existing conventions for file organization, tests, error handling, accessibility, and documentation.

## Risk Map

Map high-risk areas before changing them:

- Large or mixed-responsibility files.
- Duplicated logic or repeated data transformations.
- Hardcoded values that should use tokens, constants, config, or shared helpers.
- Unclear module boundaries or implicit coupling.
- Fragile tests, missing tests, stale snapshots, or untested user flows.
- Stale docs, outdated task files, obsolete examples, and roadmap drift.
- Unused files, placeholders, generated artifacts committed by mistake, dead config, unused exports, and unused dependencies.
- Critical user-facing flows, loading states, error states, responsive layouts, accessibility paths, and keyboard interactions.

## Refactoring Discipline

- Treat refactoring as behavior-preserving design improvement.
- Work in small, reviewable steps.
- Keep the app green between meaningful steps.
- Avoid mixing feature work with refactoring unless explicitly requested.
- Prefer established local patterns over new abstractions.
- Add abstractions only when they remove real duplication, isolate volatility, or make behavior easier to test.
- Preserve public APIs, routes, component contracts, data formats, environment variables, and visible UI behavior unless there is a documented reason to change them.
- Keep unrelated formatting churn out of the diff.
- Do not delete or rewrite user work you did not create.

## Worktree And Branch Setup

Before making changes, inspect the repository state:

- Run `git status --short --branch`.
- Confirm the current branch, upstream, and whether the tree already has uncommitted work.
- Treat existing uncommitted changes as user work unless the user explicitly says otherwise.
- Do not run destructive commands such as `git reset --hard`, `git checkout -- <path>`, or branch deletion without explicit user approval.

If the current worktree is dirty or the refactor should be isolated, create a dedicated worktree:

```bash
git fetch --all --prune
git worktree add ../<repo>-refactor-cleanup -b <your-branch-name> <base-branch>
cd ../<repo>-refactor-cleanup
```

Use a branch name that describes the cleanup scope, such as:

```text
refactor/codebase-cleanup
refactor/<area>-cleanup
chore/docs-cleanup
```

If the repository already uses a branch naming convention, follow it. If `git worktree add` is not appropriate for the local setup, stay in the current worktree only after confirming that your edits will not conflict with existing uncommitted work.

## Regression Safety Net

Before risky edits:

- Run the existing narrow and broad checks available in the repository, such as lint, typecheck, unit tests, integration tests, end-to-end tests, and build.
- Document any command that fails before changes begin.
- If tests are missing or weak, add focused characterization coverage around current behavior before changing internals.
- For UI projects, identify key flows and verify them with the repository's existing test tools, browser checks, screenshots, or documented manual checks.
- Capture current behavior for risky areas with snapshots, fixtures, golden-master tests, or browser checks when appropriate.

## Refactoring Priorities

Prefer changes in this order:

1. Remove duplication where the same concept is implemented multiple times.
2. Split oversized files, components, or modules along real responsibility boundaries.
3. Move domain logic out of rendering code when it improves testability or clarity.
4. Replace hardcoded values with existing constants, tokens, config, or shared utilities.
5. Normalize naming so each concept has one clear name across the codebase.
6. Simplify conditionals and data transformations.
7. Reduce implicit coupling between modules.
8. Improve ambiguous or fragile error handling without changing expected behavior.

## Cleanup Pass

Audit and clean non-source materials with the same care as code:

- README files, markdown docs, examples, scripts, configs, TODO notes, and generated artifacts.
- Obsolete setup instructions, stale roadmap notes, outdated architecture descriptions, and duplicated docs.
- Unused placeholders, sample files, abandoned experiments, empty directories, old screenshots, unused assets, and build artifacts that do not belong in source control.
- Unused dependencies, package scripts, environment examples, config entries, imports, exports, and barrel entries.

Only remove something after verifying it is not referenced by imports, docs, scripts, CI, tests, routes, deployment config, or runtime asset paths. Preserve historical, legal, migration, changelog, attribution, and license files unless they are clearly obsolete and safe to remove.

## Documentation Updates

After code or cleanup changes:

- Update the root README and any local agent/docs files that describe changed workflows.
- Keep docs concise and accurate.
- Prefer one current source of truth over duplicated instructions.
- Record deferred cleanup items only when they are still relevant and actionable.

## Verification Requirements

After each meaningful change, run the narrowest relevant check. Before finishing, run the full available verification suite for the project, commonly:

- Format or lint checks.
- Typecheck.
- Unit and integration tests.
- End-to-end or browser checks when user-facing flows changed.
- Production build or package build.

For frontend work, verify important screens at desktop and mobile widths. Check accessibility, loading states, error states, theme support, responsive layout, and keyboard interaction when applicable.

Do not claim behavior is preserved unless it was verified by relevant commands, tests, screenshots, or manual checks.

## Commit, Push, And Pull Request Workflow

Commit only intentional, reviewed changes:

- Review `git status --short` and `git diff` before staging.
- Stage files explicitly by path. Avoid `git add -A` for broad refactors unless the full diff has been reviewed.
- Keep commits small and logically grouped.
- Use imperative commit messages, for example `Split chat storage helpers` or `Remove stale task notes`.
- Do not include AI attribution trailers unless the repository explicitly requires them.
- Do not bypass hooks or checks with `--no-verify` unless the user explicitly approves and the reason is documented.

Before pushing:

- Re-run the repository's required verification commands.
- Confirm generated files are either intentionally updated or left untouched according to local rules.
- Confirm removed files are not referenced by imports, docs, scripts, CI, tests, routes, deployment config, or runtime asset paths.

Push the branch with upstream tracking:

```bash
git push -u origin <your-branch-name>
```

Open a pull request using the repository's preferred tool. If GitHub CLI is available and appropriate:

```bash
gh pr create --fill --base <base-branch> --head <your-branch-name>
```

The pull request description should include:

- Summary of behavior-preserving cleanup performed.
- Files removed, archived, or materially simplified.
- Verification commands and results.
- Known risks, intentionally skipped stale areas, and recommended follow-ups.

After opening the PR, check CI status. If CI fails, inspect the logs, fix only the relevant failure, rerun local checks, commit, and push again.

## Deliverables

At the end of the work, report:

- What changed and why.
- Files removed, archived, or materially simplified.
- Verification commands run and their results.
- Commands that could not be run and why.
- Remaining risks, intentionally skipped stale areas, and recommended follow-up refactors.

## Suggested Next-Agent Prompt Template

```text
Use the reusable refactor goal at <path-to-this-file>.

Apply it to this repository. First read the local agent instructions and project docs, then discover the framework, commands, routes, source layout, generated files, and verification suite. Keep changes behavior-preserving, incremental, and verified. Respect local conventions and do not remove files until you have checked references through imports, docs, scripts, CI, tests, routes, deployment config, and runtime asset paths.

Before editing, inspect git status. If the tree is dirty or isolation is useful, create a dedicated worktree and branch before changing files. Report any pre-existing failing checks. After editing, commit small logical changes, push the branch, open a PR if requested or expected by the repo workflow, then summarize changed files, removed files, verification results, PR link, remaining risks, and follow-up refactors.
```
