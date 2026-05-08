import fs from 'node:fs/promises';
import path from 'node:path';

import { PORTFOLIO_STATUSES, validatePortfolioPayload } from './portfolio-sync-schema.mjs';

const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'scripts', 'portfolio-sync.config.json');
const args = new Set(process.argv.slice(2));
const isValidateOnly = args.has('--validate');
const isDryRun = args.has('--dry-run');
const isCI = args.has('--ci');
const sourceLabel = isCI ? 'ci' : 'manual';

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
}

function toNumber(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeString(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : '';
}

function normalizeStatus(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return 'Completed';
  }

  if (PORTFOLIO_STATUSES.includes(normalized)) {
    return normalized;
  }

  return 'Completed';
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizeString(item))
        .filter(Boolean)
    )
  );
}

function slugify(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function githubRawUrl(owner, repo, branch, filePath) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

function isRelativeAsset(value) {
  return (
    typeof value === 'string'
    && normalizeString(value).length > 0
    && !/^(?:[a-z]+:)?\/\//i.test(value)
    && !value.startsWith('/')
  );
}

function resolveAssetUrl(value, owner, repo, branch) {
  const normalized = normalizeString(value);
  if (!normalized) return '';

  if (isRelativeAsset(normalized)) {
    return githubRawUrl(owner, repo, branch, normalized);
  }

  return normalized;
}

function parseSyncOutput(payload, mode) {
  if (payload && typeof payload === 'object' && mode === 'cli') {
    const stamp = {
      lastSyncedAt: new Date().toISOString(),
      stale: false,
      source: `github/${sourceLabel}`,
    };

    payload.sync = {
      ...payload.sync,
      ...stamp,
      stale: false,
      staleReason: '',
    };
  }

  return payload;
}

async function loadConfig() {
  const raw = await fs.readFile(DEFAULT_CONFIG_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid sync config');
  }

  return {
    githubApiBase: normalizeString(parsed.githubApiBase) || 'https://api.github.com',
    githubUser: normalizeString(parsed.githubUser),
    githubOrg: normalizeString(parsed.githubOrg) || null,
    githubTokenEnv: normalizeString(parsed.githubTokenEnv) || 'PORTFOLIO_GITHUB_TOKEN',
    githubTokenFallbackEnv: normalizeString(parsed.githubTokenFallbackEnv) || 'GITHUB_TOKEN',
    outputPath: normalizeString(parsed.outputPath) || 'src/content/portfolio.json',
    includePrivate: toBoolean(parsed.includePrivate, false),
    excludeRepos: normalizeArray(parsed.excludeRepos),
    repoNameAllowlist: normalizeArray(parsed.repoNameAllowlist),
    maxReposPerSync: toNumber(parsed.maxReposPerSync, 100),
    fallbackToExistingOnRateLimit: toBoolean(parsed.fallbackToExistingOnRateLimit, true),
    defaultProjectCategory: normalizeString(parsed.defaultProjectCategory) || 'Software',
  };
}

function getGithubToken(config) {
  const tokenName = config.githubTokenEnv || 'PORTFOLIO_GITHUB_TOKEN';
  const fallbackName = config.githubTokenFallbackEnv || 'GITHUB_TOKEN';
  const primary = process.env[tokenName];
  if (primary) return primary;
  return process.env[fallbackName];
}

async function requestJson(url, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bentosite-portfolio-sync',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : {};
  } catch (_error) {
    throw new Error(`GitHub API returned a non-JSON response for ${url}`);
  }

  if (response.status === 403 && body && body.message && /rate limit/i.test(body.message)) {
    const reset = response.headers.get('x-ratelimit-reset');
    const until = reset ? Number.parseInt(reset, 10) : null;
    const date = Number.isFinite(until) ? new Date(until * 1000).toISOString() : 'unknown';
    const error = new Error(`GitHub rate limit reached; reset at ${date}`);
    error.name = 'RateLimitError';
    throw error;
  }

  if (!response.ok) {
    const details = typeof body?.message === 'string' ? body.message : `status ${response.status}`;
    const error = new Error(`GitHub API request failed (${response.status}): ${details}`);
    error.name = `HttpError${response.status}`;
    throw error;
  }

  return { data: body, headers: response.headers };
}

function parseLinkHeader(linkHeader) {
  if (!linkHeader) return [];
  return linkHeader
    .split(',')
    .map((part) => part.trim())
    .map((part) => {
      const [urlPart, relPart] = part.split(';').map((item) => item.trim());
      const relMatch = /rel="([^"]+)"/.exec(relPart || '');
      const urlMatch = /<([^>]+)>/.exec(urlPart || '');
      if (!relMatch || !urlMatch) return null;
      return { rel: relMatch[1], url: urlMatch[1] };
    })
    .filter(Boolean);
}

function getNextPageUrl(headers) {
  const links = parseLinkHeader(headers.get('link'));
  const next = links.find((item) => item.rel === 'next');
  return next ? next.url : null;
}

async function listRepos(config, token) {
  const entity = config.githubOrg || config.githubUser;
  if (!entity) {
    throw new Error('No GitHub user or org configured');
  }

  const endpoint = config.githubOrg ? 'orgs' : 'users';
  const urlBase = `${config.githubApiBase}/${endpoint}/${encodeURIComponent(entity)}/repos`;
  const params = new URLSearchParams({
    per_page: String(Math.min(config.maxReposPerSync, 100)),
    sort: 'updated',
    direction: 'desc',
    visibility: config.includePrivate ? 'all' : 'public',
    type: 'owner',
  });
  const repoPages = [];
  let nextUrl = `${urlBase}?${params.toString()}`;

  while (nextUrl) {
    const response = await requestJson(nextUrl, token);
    if (!Array.isArray(response.data)) {
      throw new Error('Unexpected repository response from GitHub');
    }

    repoPages.push(...response.data);
    nextUrl = getNextPageUrl(response.headers);
    if (repoPages.length >= config.maxReposPerSync) break;
  }

  return repoPages.slice(0, config.maxReposPerSync).map((repo) => ({
    id: repo.id,
    name: normalizeString(repo.name),
    fullName: normalizeString(repo.full_name),
    defaultBranch: normalizeString(repo.default_branch) || 'main',
    description: normalizeString(repo.description),
    archived: Boolean(repo.archived),
    fork: Boolean(repo.fork),
    private: Boolean(repo.private),
    updatedAt: normalizeString(repo.updated_at),
    owner: {
      login: normalizeString(repo.owner?.login) || config.githubUser,
    },
    htmlUrl: normalizeString(repo.html_url),
  })).filter((repo) => repo.name && repo.owner.login);
}

function selectReposForSync(repos, config) {
  return repos.filter((repo) => {
    if (!repo) return false;
    if (config.repoNameAllowlist.length === 0) return true;
    const normalizedName = repo.name.toLowerCase();
    return config.repoNameAllowlist.some((allowed) => allowed.toLowerCase() === normalizedName);
  });
}

function dedupeProjects(projects) {
  const seen = new Set();
  return projects.filter((project) => {
    if (!project || typeof project.id !== 'string') return false;
    if (seen.has(project.id)) return false;
    seen.add(project.id);
    return true;
  });
}

function buildMedia(rawMedia, repoMeta) {
  const featuredImage = resolveAssetUrl(
    rawMedia.featuredImage ?? rawMedia.featureImage ?? rawMedia.poster,
    repoMeta.owner.login,
    repoMeta.name,
    repoMeta.defaultBranch
  );

  const images = normalizeArray(
    rawMedia.images || []
  ).map((value) => resolveAssetUrl(value, repoMeta.owner.login, repoMeta.name, repoMeta.defaultBranch));

  const website = resolveAssetUrl(
    rawMedia.website,
    repoMeta.owner.login,
    repoMeta.name,
    repoMeta.defaultBranch
  );
  const video = resolveAssetUrl(
    rawMedia.video,
    repoMeta.owner.login,
    repoMeta.name,
    repoMeta.defaultBranch
  );

  const media = {
    ...rawMedia,
  };

  if (featuredImage) media.featuredImage = featuredImage;
  if (images.length) media.images = images;
  if (website) media.website = website;
  if (video) media.video = video;
  if (rawMedia.pdf) {
    media.pdf = resolveAssetUrl(
      rawMedia.pdf,
      repoMeta.owner.login,
      repoMeta.name,
      repoMeta.defaultBranch
    );
  }

  return media;
}

function normalizeProjectPayload(cfg, repoMeta, config) {
  const sourceOverride = normalizeString(cfg.id);
  const id = sourceOverride || slugify(`${repoMeta.owner.login}-${repoMeta.name}`);
  const rawLinks = cfg.links && typeof cfg.links === 'object' ? cfg.links : {};
  const rawMedia = cfg.media && typeof cfg.media === 'object' ? cfg.media : {};
  const status = normalizeStatus(cfg.status);
  const category = normalizeString(cfg.category) || config.defaultProjectCategory;
  const shortDescription = normalizeString(cfg.shortDescription) || normalizeString(cfg.description) || normalizeString(repoMeta.description) || `Project from ${repoMeta.name}`;
  const description = normalizeString(cfg.description) || shortDescription;
  const website = normalizeString(cfg.website) || normalizeString(rawMedia.website);
  const video = normalizeString(cfg.video) || normalizeString(rawMedia.video);
  const featured = typeof cfg.featured === 'boolean' ? cfg.featured : false;
  const dateCompleted = normalizeString(cfg.dateCompleted) || normalizeString(repoMeta.updatedAt).slice(0, 7);

  const media = buildMedia({
    ...rawMedia,
    website,
    video,
    featuredImage: normalizeString(cfg.featuredImage) || normalizeString(rawMedia.featuredImage),
    images: normalizeArray(cfg.images || rawMedia.images),
    game: rawMedia.game,
    pdf: normalizeString(cfg.pdf) || normalizeString(rawMedia.pdf),
  }, repoMeta);

  const technologies = normalizeArray(cfg.technologies?.filter((value) => typeof value === 'string') || []);

  const thumbnailCandidates = [];
  if (media.featuredImage) thumbnailCandidates.push(media.featuredImage);
  if (media.images?.length) thumbnailCandidates.push(media.images[0]);
  if (typeof cfg.thumbnail === 'string' && cfg.thumbnail.trim()) {
    thumbnailCandidates.push(resolveAssetUrl(cfg.thumbnail, repoMeta.owner.login, repoMeta.name, repoMeta.defaultBranch));
  }

  const githubLink = normalizeString(rawLinks.github) || repoMeta.htmlUrl;
  const liveDemo = normalizeString(rawLinks.liveDemo) || website;
  const docs = normalizeString(rawLinks.docs);

  const project = {
    id,
    name: normalizeString(cfg.name) || repoMeta.name,
    shortDescription,
    description,
    category,
    status,
    technologies,
    links: {
      ...(githubLink ? { github: githubLink } : {}),
      ...(liveDemo ? { liveDemo } : {}),
      ...(docs ? { docs } : {}),
    },
    media,
    featured,
    dateCompleted,
    source: {
      type: 'github',
      url: repoMeta.htmlUrl,
      repo: repoMeta.fullName,
    },
    thumbnail: thumbnailCandidates[0] || undefined,
  };

  if (!Array.isArray(project.technologies)) {
    project.technologies = [];
  }

  return project;
}

async function readPortfolioFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function mergePortfolioPayload(current, syncedProjects) {
  const baseProjects = Array.isArray(current.projects) ? current.projects : [];
  const syncedIds = new Set(syncedProjects.map((project) => project.id));
  const syncedGithubLinks = new Set(
    syncedProjects
      .map((project) => normalizeString(project.links?.github).toLowerCase())
      .filter(Boolean)
  );
  const preservedProjects = baseProjects.filter((project) => {
    const id = normalizeString(project.id);
    const link = normalizeString(project.links?.github).toLowerCase();
    return !syncedIds.has(id) && !syncedGithubLinks.has(link) && project.source?.type !== 'github';
  });

  return {
    ...current,
    projects: [...syncedProjects, ...preservedProjects],
    sync: {
      ...(current.sync || {}),
      source: `github/${sourceLabel}`,
      lastSyncedAt: new Date().toISOString(),
      stale: false,
    },
  };
}

async function fetchPortfolioConfigForRepo(repoMeta, token, config) {
  const rawOwner = encodeURIComponent(repoMeta.owner.login);
  const rawRepo = encodeURIComponent(repoMeta.name);
  const contentsPath = `${config.githubApiBase}/repos/${rawOwner}/${rawRepo}/contents/.portfolio.json?ref=${encodeURIComponent(repoMeta.defaultBranch)}`;
  const { data: filePayload } = await requestJson(contentsPath, token);

  if (
    !filePayload
    || typeof filePayload !== 'object'
    || !filePayload.content
    || typeof filePayload.content !== 'string'
    || filePayload.encoding !== 'base64'
  ) {
    throw new Error(`Unexpected .portfolio.json payload for ${repoMeta.fullName}`);
  }

  const decoded = Buffer.from(filePayload.content, 'base64').toString('utf8');
  const parsed = JSON.parse(decoded);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid .portfolio.json payload for ${repoMeta.fullName}`);
  }

  return parsed;
}

async function runSync(config) {
  const token = getGithubToken(config);
  const repos = await listRepos(config, token);
  const candidateRepos = repos.filter((repo) => !config.excludeRepos.includes(repo.name));
  const synced = [];
  let skipped = 0;
  let failed = 0;

  const filteredRepos = selectReposForSync(candidateRepos, config);

  for (const repoMeta of filteredRepos) {
    try {
      if (repoMeta.archived) {
        continue;
      }

      if (repoMeta.private && !config.includePrivate) {
        continue;
      }

      const repoConfig = await fetchPortfolioConfigForRepo(repoMeta, token, config);
      const project = normalizeProjectPayload(repoConfig, repoMeta, config);
      synced.push(project);
    } catch (error) {
      if (error instanceof Error && (error.name === 'HttpError404' || error.name === 'RateLimitError')) {
        if (error.name === 'RateLimitError') {
          throw error;
        }
        skipped += 1;
        continue;
      }

      failed += 1;
      console.error(`Failed to parse .portfolio.json for ${repoMeta.fullName}: ${error.message}`);
    }
  }

  const distinctProjects = dedupeProjects(synced);
  const currentContent = await readPortfolioFile(config.outputPath);
  const merged = mergePortfolioPayload(currentContent, distinctProjects);
  const validation = validatePortfolioPayload(merged);
  if (!validation.valid) {
    const detail = validation.errors.slice(0, 10).join('\n  - ');
    throw new Error(`Validation failed after sync:\n  - ${detail}`);
  }

  const payload = parseSyncOutput(merged, 'cli');
  return {
    payload,
    summary: {
      syncedCount: distinctProjects.length,
      skippedCount: skipped,
      failedCount: failed,
      stale: false,
    },
  };
}

function applyRateLimitFallback(currentContent, reason) {
  const sync = {
    ...(currentContent.sync || {}),
    source: 'github/manual-fallback',
    lastSyncedAt: new Date().toISOString(),
    stale: true,
    staleReason: normalizeString(reason),
  };

  return {
    ...currentContent,
    sync,
  };
}

async function runValidateOnly(config) {
  const currentContent = await readPortfolioFile(config.outputPath);
  const validation = validatePortfolioPayload(currentContent);
  if (!validation.valid) {
    console.error('Portfolio schema validation failed:');
    for (const message of validation.errors) {
      console.error(`- ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Portfolio schema validation passed.');
}

async function main() {
  const config = await loadConfig();

  if (isValidateOnly) {
    await runValidateOnly(config);
    return;
  }

  let result;
  try {
    result = await runSync(config);
  } catch (error) {
    if (error instanceof Error && error.name === 'RateLimitError' && config.fallbackToExistingOnRateLimit) {
      const currentContent = await readPortfolioFile(config.outputPath);
      const fallback = applyRateLimitFallback(currentContent, error.message);
      const validation = validatePortfolioPayload(fallback);
      if (!validation.valid) {
        console.error('Portfolio fallback payload failed validation:');
        for (const message of validation.errors) {
          console.error(`- ${message}`);
        }
        process.exitCode = 1;
        return;
      }

      result = { payload: fallback, summary: { syncedCount: 0, skippedCount: 0, failedCount: 0, stale: true } };
    } else {
      console.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  const outputPath = path.resolve(process.cwd(), config.outputPath);
  const data = JSON.stringify(result.payload, null, 2) + '\n';

  if (isDryRun) {
    process.stdout.write(data);
    return;
  }

  if (!isDryRun) {
    await fs.writeFile(outputPath, data, 'utf8');
  }

  const { syncedCount, skippedCount, failedCount, stale } = result.summary;
  console.log(
    `Sync complete${stale ? ' (stale fallback)' : ''}: ${syncedCount} synced, ${skippedCount} skipped, ${failedCount} failed`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
