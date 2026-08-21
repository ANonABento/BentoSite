'use client';

/** Typed fetch helpers for the dev-only Studio API. */

export interface StudioProjectMedia {
  featuredImage?: string;
  images?: string[];
  video?: string;
  website?: string;
  pdf?: string;
  game?: { type: string; url: string };
}

export interface StudioProject {
  id: string;
  name: string;
  shortDescription: string;
  description?: string;
  category: string;
  status: 'Completed' | 'In Progress' | 'Archived';
  technologies: string[];
  featured?: boolean;
  dateCompleted?: string;
  order?: number;
  links?: {
    github?: string;
    liveDemo?: string;
    docs?: string;
    modelPath?: string;
  };
  media?: StudioProjectMedia;
}

export interface StudioPhoto {
  slug: string;
  file: string;
  src: string;
  hasSidecar: boolean;
  title: string;
  location: string;
  year: string;
  alt: string;
}

export interface StudioTalkingPoint {
  id: string;
  title: string;
  content: string;
  keywords?: string[];
}

export interface StudioPortfolio {
  personal: Record<string, string>;
  about: string;
  skills: { hardware: string[]; software: string[]; tools: string[] };
  experience: unknown[];
  education: unknown[];
}

export class StudioApiError extends Error {
  details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = 'StudioApiError';
    this.details = details;
  }
}

const BASE = '/api/studio';

async function unwrap<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    details?: string[];
  };
  if (!response.ok) {
    throw new StudioApiError(payload.error ?? `Request failed (${response.status})`, payload.details ?? []);
  }
  return payload as T;
}

function jsonRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  return fetch(`${BASE}/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((response) => unwrap<T>(response));
}

export const studioApi = {
  listProjects: () => jsonRequest<{ projects: StudioProject[] }>('projects', 'GET'),
  saveProject: (project: StudioProject) =>
    jsonRequest<{ project: StudioProject }>('projects', 'POST', { project }),
  deleteProject: (id: string) =>
    fetch(`${BASE}/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).then(unwrap),
  reorderProjects: (ids: string[]) =>
    jsonRequest<{ order: string[] }>('projects/reorder', 'POST', { ids }),

  listPhotos: () => jsonRequest<{ photos: StudioPhoto[] }>('photos', 'GET'),
  savePhotoMeta: (slug: string, meta: Omit<StudioPhoto, 'slug' | 'file' | 'src' | 'hasSidecar'>) =>
    jsonRequest<{ sidecar: unknown }>('photos/meta', 'POST', { slug, meta }),
  deletePhoto: (slug: string) =>
    fetch(`${BASE}/photos?id=${encodeURIComponent(slug)}`, { method: 'DELETE' }).then(unwrap),

  listTalkingPoints: () => jsonRequest<{ points: StudioTalkingPoint[] }>('talking-points', 'GET'),
  saveTalkingPoint: (point: StudioTalkingPoint) =>
    jsonRequest<{ point: StudioTalkingPoint }>('talking-points', 'POST', { point }),
  deleteTalkingPoint: (id: string) =>
    fetch(`${BASE}/talking-points?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).then(unwrap),

  readPortfolio: () => jsonRequest<{ portfolio: StudioPortfolio }>('portfolio', 'GET'),
  savePortfolio: (portfolio: StudioPortfolio) =>
    jsonRequest<{ portfolio: StudioPortfolio }>('portfolio', 'POST', { portfolio }),

  sync: () => jsonRequest<{ ok: boolean; output: string }>('sync', 'POST'),
  git: (message: string, push: boolean) =>
    jsonRequest<{ ok: boolean; output: string }>('git', 'POST', { message, push }),

  uploadPhoto: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<{ photo: { slug: string; src: string } }>(
      await fetch(`${BASE}/photos`, { method: 'POST', body: form }),
    );
  },

  uploadProjectAsset: async (projectId: string, file: File, kind: 'image' | 'doc' | 'model') => {
    const form = new FormData();
    form.append('file', file);
    form.append('projectId', projectId);
    form.append('kind', kind);
    return unwrap<{ path: string }>(
      await fetch(`${BASE}/assets`, { method: 'POST', body: form }),
    );
  },
};

export const PROJECT_STATUSES: StudioProject['status'][] = [
  'Completed',
  'In Progress',
  'Archived',
];

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
