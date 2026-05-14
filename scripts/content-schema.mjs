// Schema validators for portfolio content.
// Source of truth for the shape of src/content/portfolio.json,
// src/content/projects/*.json, and src/content/talking-points/*.json.

const VALID_STATUSES = ['Completed', 'In Progress', 'Archived'];

function isArrayOfStrings(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasStringField(obj, key) {
  return typeof obj[key] === 'string' && obj[key].trim().length > 0;
}

function assertValidDateMonth(value, path, errors) {
  if (value === undefined || value === null || value === '') return;

  if (typeof value !== 'string') {
    errors.push(`${path}: expected a date string in YYYY-MM format`);
    return;
  }

  if (!/^\d{4}-\d{2}$/.test(value) && !/^\d{4}$/.test(value)) {
    errors.push(`${path}: expected YYYY or YYYY-MM date format`);
    return;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const month = Number.parseInt(value.split('-')[1], 10);
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      errors.push(`${path}: expected month between 01 and 12`);
    }
  }
}

function validateMedia(media, path, errors) {
  if (media === undefined) return;

  if (typeof media !== 'object' || media === null || Array.isArray(media)) {
    errors.push(`${path}: expected an object`);
    return;
  }

  if (media.featuredImage !== undefined && typeof media.featuredImage !== 'string') {
    errors.push(`${path}.featuredImage: expected a string`);
  }

  if (media.images !== undefined && !isArrayOfStrings(media.images)) {
    errors.push(`${path}.images: expected a string array`);
  }

  for (const key of ['video', 'website', 'pdf']) {
    if (media[key] !== undefined && typeof media[key] !== 'string') {
      errors.push(`${path}.${key}: expected a string`);
    }
  }

  if (media.game !== undefined) {
    if (typeof media.game !== 'object' || media.game === null || Array.isArray(media.game)) {
      errors.push(`${path}.game: expected an object`);
    } else {
      if (typeof media.game.type !== 'string') {
        errors.push(`${path}.game.type: expected a string`);
      }
      if (typeof media.game.url !== 'string') {
        errors.push(`${path}.game.url: expected a string`);
      }
    }
  }
}

function validateLinks(links, path, errors) {
  if (links === undefined) return;

  if (typeof links !== 'object' || links === null || Array.isArray(links)) {
    errors.push(`${path}: expected an object`);
    return;
  }

  for (const key of ['github', 'liveDemo', 'modelPath', 'docs']) {
    if (links[key] !== undefined && typeof links[key] !== 'string') {
      errors.push(`${path}.${key}: expected a string`);
    }
  }
}

export function validateProject(project, source = 'project') {
  const errors = [];

  if (typeof project !== 'object' || project === null || Array.isArray(project)) {
    return [`${source}: expected an object`];
  }

  if (!hasStringField(project, 'id')) errors.push('id: expected a non-empty string');
  if (!hasStringField(project, 'name')) errors.push('name: expected a non-empty string');
  if (!hasStringField(project, 'shortDescription')) errors.push('shortDescription: expected a non-empty string');
  if (!hasStringField(project, 'category')) errors.push('category: expected a non-empty string');

  if (!hasStringField(project, 'status')) {
    errors.push('status: expected a non-empty string');
  } else if (!VALID_STATUSES.includes(project.status)) {
    errors.push(`status: expected one of ${VALID_STATUSES.join(', ')}`);
  }

  if (!isArrayOfStrings(project.technologies)) {
    errors.push('technologies: expected a string array');
  }

  if (project.thumbnail !== undefined && typeof project.thumbnail !== 'string') {
    errors.push('thumbnail: expected a string');
  }

  if (project.featured !== undefined && typeof project.featured !== 'boolean') {
    errors.push('featured: expected a boolean');
  }

  if (project.dateCompleted !== undefined) {
    assertValidDateMonth(project.dateCompleted, 'dateCompleted', errors);
  }

  if (project.description !== undefined && typeof project.description !== 'string') {
    errors.push('description: expected a string');
  }

  validateMedia(project.media, 'media', errors);
  validateLinks(project.links, 'links', errors);

  return errors;
}

export function validatePortfolio(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['portfolio: expected a JSON object'] };
  }

  if (!payload.personal || typeof payload.personal !== 'object' || Array.isArray(payload.personal)) {
    errors.push('personal: expected an object');
  } else {
    for (const key of ['name', 'title', 'location', 'email', 'github', 'linkedin']) {
      if (!hasStringField(payload.personal, key)) {
        errors.push(`personal.${key}: expected a non-empty string`);
      }
    }
  }

  if (!hasStringField(payload, 'about')) {
    errors.push('about: expected a non-empty string');
  }

  if (!payload.skills || typeof payload.skills !== 'object' || Array.isArray(payload.skills)) {
    errors.push('skills: expected an object');
  } else {
    for (const key of ['hardware', 'software', 'tools']) {
      if (!isArrayOfStrings(payload.skills[key])) {
        errors.push(`skills.${key}: expected a string array`);
      }
    }
  }

  if (!Array.isArray(payload.experience)) {
    errors.push('experience: expected an array');
  } else if (payload.experience.some((entry) => typeof entry !== 'object' || entry === null)) {
    errors.push('experience: expected each item to be an object');
  }

  if (!Array.isArray(payload.education)) {
    errors.push('education: expected an array');
  } else if (payload.education.some((entry) => typeof entry !== 'object' || entry === null)) {
    errors.push('education: expected each item to be an object');
  }

  if (payload.projects !== undefined) {
    errors.push(
      'projects: this field is no longer used in portfolio.json. Move each project to src/content/projects/<id>.json (see AGENTS.md).'
    );
  }

  return { valid: errors.length === 0, errors };
}

export function validateTalkingPoint(point, source = 'talking-point') {
  const errors = [];

  if (typeof point !== 'object' || point === null || Array.isArray(point)) {
    return [`${source}: expected an object`];
  }

  if (!hasStringField(point, 'id')) errors.push('id: expected a non-empty string');
  if (!hasStringField(point, 'title')) errors.push('title: expected a non-empty string');
  if (!hasStringField(point, 'content')) errors.push('content: expected a non-empty string');

  if (point.keywords !== undefined && !isArrayOfStrings(point.keywords)) {
    errors.push('keywords: expected a string array');
  }

  return errors;
}

export const PORTFOLIO_STATUSES = VALID_STATUSES;
