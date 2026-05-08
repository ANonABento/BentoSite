const VALID_STATUSES = ['Completed', 'In Progress', 'Archived'];

export function isArrayOfStrings(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function assertValidDateMonth(value, path, errors) {
  if (value === undefined || value === null || value === '') {
    return;
  }

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

function hasStringField(obj, key) {
  return typeof obj[key] === 'string' && obj[key].trim().length > 0;
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

  if (media.video !== undefined && typeof media.video !== 'string') {
    errors.push(`${path}.video: expected a string`);
  }

  if (media.website !== undefined && typeof media.website !== 'string') {
    errors.push(`${path}.website: expected a string`);
  }

  if (media.pdf !== undefined && typeof media.pdf !== 'string') {
    errors.push(`${path}.pdf: expected a string`);
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

  if (links.github !== undefined && typeof links.github !== 'string') {
    errors.push(`${path}.github: expected a string`);
  }

  if (links.liveDemo !== undefined && typeof links.liveDemo !== 'string') {
    errors.push(`${path}.liveDemo: expected a string`);
  }

  if (links.modelPath !== undefined && typeof links.modelPath !== 'string') {
    errors.push(`${path}.modelPath: expected a string`);
  }

  if (links.docs !== undefined && typeof links.docs !== 'string') {
    errors.push(`${path}.docs: expected a string`);
  }
}

function validateProject(project, index, errors) {
  const base = `projects[${index}]`;

  if (typeof project !== 'object' || project === null || Array.isArray(project)) {
    errors.push(`${base}: expected an object`);
    return;
  }

  if (!hasStringField(project, 'id')) {
    errors.push(`${base}.id: expected a non-empty string`);
  }

  if (!hasStringField(project, 'name')) {
    errors.push(`${base}.name: expected a non-empty string`);
  }

  if (!hasStringField(project, 'shortDescription')) {
    errors.push(`${base}.shortDescription: expected a non-empty string`);
  }

  if (!hasStringField(project, 'category')) {
    errors.push(`${base}.category: expected a non-empty string`);
  }

  if (!hasStringField(project, 'status')) {
    errors.push(`${base}.status: expected a non-empty string`);
  } else if (!VALID_STATUSES.includes(project.status)) {
    errors.push(`${base}.status: expected one of ${VALID_STATUSES.join(', ')}`);
  }

  if (!isArrayOfStrings(project.technologies)) {
    errors.push(`${base}.technologies: expected a string array`);
  }

  if (project.thumbnail !== undefined && typeof project.thumbnail !== 'string') {
    errors.push(`${base}.thumbnail: expected a string`);
  }

  if (project.featured !== undefined && typeof project.featured !== 'boolean') {
    errors.push(`${base}.featured: expected a boolean`);
  }

  if (project.source !== undefined) {
    if (typeof project.source !== 'object' || project.source === null || Array.isArray(project.source)) {
      errors.push(`${base}.source: expected an object`);
    } else {
      if (project.source.type !== undefined && typeof project.source.type !== 'string') {
        errors.push(`${base}.source.type: expected a string`);
      }

      if (project.source.url !== undefined && typeof project.source.url !== 'string') {
        errors.push(`${base}.source.url: expected a string`);
      }

      if (project.source.repo !== undefined && typeof project.source.repo !== 'string') {
        errors.push(`${base}.source.repo: expected a string`);
      }
    }
  }

  if (project.dateCompleted !== undefined) {
    assertValidDateMonth(project.dateCompleted, `${base}.dateCompleted`, errors);
  }

  if (project.description !== undefined && typeof project.description !== 'string') {
    errors.push(`${base}.description: expected a string`);
  }

  validateMedia(project.media, `${base}.media`, errors);
  validateLinks(project.links, `${base}.links`, errors);
}

export function validatePortfolioPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    errors.push('portfolio: expected a JSON object');
    return { valid: false, errors };
  }

  if (!payload.personal || typeof payload.personal !== 'object' || Array.isArray(payload.personal)) {
    errors.push('personal: expected an object');
  }

  if (!hasStringField(payload, 'about')) {
    errors.push('about: expected a non-empty string');
  }

  if (!payload.skills || typeof payload.skills !== 'object' || Array.isArray(payload.skills)) {
    errors.push('skills: expected an object');
  } else {
    if (!isArrayOfStrings(payload.skills.hardware)) {
      errors.push('skills.hardware: expected a string array');
    }

    if (!isArrayOfStrings(payload.skills.software)) {
      errors.push('skills.software: expected a string array');
    }

    if (!isArrayOfStrings(payload.skills.tools)) {
      errors.push('skills.tools: expected a string array');
    }
  }

  if (!Array.isArray(payload.projects)) {
    errors.push('projects: expected an array');
  } else {
    payload.projects.forEach((project, index) => validateProject(project, index, errors));
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

  if (payload.sync !== undefined) {
    if (typeof payload.sync !== 'object' || payload.sync === null || Array.isArray(payload.sync)) {
      errors.push('sync: expected an object');
    } else {
      if (payload.sync.lastSyncedAt !== undefined && typeof payload.sync.lastSyncedAt !== 'string') {
        errors.push('sync.lastSyncedAt: expected a string');
      }

      if (payload.sync.stale !== undefined && typeof payload.sync.stale !== 'boolean') {
        errors.push('sync.stale: expected a boolean');
      }

      if (payload.sync.staleReason !== undefined && typeof payload.sync.staleReason !== 'string') {
        errors.push('sync.staleReason: expected a string');
      }

      if (payload.sync.source !== undefined && typeof payload.sync.source !== 'string') {
        errors.push('sync.source: expected a string');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export const PORTFOLIO_STATUSES = VALID_STATUSES;
