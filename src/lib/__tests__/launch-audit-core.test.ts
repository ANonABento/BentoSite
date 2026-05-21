import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type AuditModule = {
  auditLaunchContent: (input: {
    projectsContent: { projects: ProjectFixture[] };
    photoManifest: { photos: unknown[] };
    talkingPointsContent: { points: unknown[] };
  }) => {
    assetRequests: Array<{
      command: string;
      currentCount?: number;
      destination?: string;
      neededCount?: number;
      notes?: string[];
      projectId?: string;
      projectName?: string;
      targetCount?: number;
      type: string;
    }>;
    blockingCount: number;
    commands: string[];
    counts: {
      photos: number;
      projects: number;
      talkingPoints: number;
    };
    deferredAssetRequests: Array<{
      command: string;
      destination?: string;
      notes?: string[];
      projectId?: string;
      projectName?: string;
      type: string;
    }>;
    findings: Array<{ title: string; items: string[] }>;
    globalGaps: string[];
  };
  renderAssetRequestsMarkdown: (
    audit: {
      assetRequests: Array<Record<string, unknown>>;
      blockingCount: number;
      counts: { photos: number; projects: number; talkingPoints: number };
      deferredAssetRequests?: Array<Record<string, unknown>>;
      findings: Array<{ title: string; items: string[] }>;
      globalGaps: string[];
    },
    options?: { generatedAt?: string },
  ) => string;
};

type ProjectFixture = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  featured?: boolean;
  shortDescription?: string;
  media?: {
    featuredImage?: string;
    images?: string[];
  };
  links?: {
    modelPath?: string;
  };
  thumbnail?: string;
};

const LONG_DESCRIPTION = 'A production-grade project description. '.repeat(12);

async function loadAuditModule(): Promise<AuditModule> {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'scripts/launch-audit-core.mjs')).href;
  return import(moduleUrl) as Promise<AuditModule>;
}

function project(overrides: Partial<ProjectFixture> = {}): ProjectFixture {
  return {
    id: 'stable-project',
    name: 'Stable Project',
    category: 'Software',
    description: LONG_DESCRIPTION,
    media: {
      featuredImage: '/projects/stable/hero.png',
    },
    shortDescription: 'A stable software project',
    ...overrides,
  };
}

function photos(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: `photo-${index}` }));
}

function talkingPoints(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: `point-${index}` }));
}

describe('launch audit core', () => {
  it('tracks robotics or hardware projects without real model paths as deferred opportunities', async () => {
    const { auditLaunchContent } = await loadAuditModule();
    const audit = auditLaunchContent({
      photoManifest: { photos: photos(12) },
      projectsContent: {
        projects: [
          project({
            category: 'Robotics',
            featured: true,
            id: 'robotic-arm-puppeteer',
            media: { featuredImage: '/projects/robotic-arm/hero.png', images: ['/projects/robotic-arm/detail.png'] },
            name: 'Robotic Arm Puppeteer',
          }),
          project({
            category: 'Hardware',
            featured: true,
            id: 'pcb-design',
            media: { featuredImage: '/projects/pcb/hero.png', images: ['/projects/pcb/detail.png'] },
            name: 'PCB Design',
          }),
        ],
      },
      talkingPointsContent: { points: talkingPoints(8) },
    });

    expect(audit.blockingCount).toBe(0);
    expect(audit.assetRequests).toEqual([]);
    expect(audit.findings).toContainEqual({
      title: 'Deferred hardware/robotics/VR projects without 3D modelPath',
      items: ['robotic-arm-puppeteer (Robotic Arm Puppeteer)', 'pcb-design (PCB Design)'],
    });
    expect(audit.commands).toEqual([]);
    expect(audit.deferredAssetRequests).toMatchObject([
      {
        destination: 'public/models/robotic-arm-puppeteer/main.<ext>',
        notes: ['Need a real project-owned CAD or 3D model export. Do not use generated placeholder geometry for launch.'],
        projectId: 'robotic-arm-puppeteer',
        projectName: 'Robotic Arm Puppeteer',
        type: 'deferred-model',
      },
      {
        destination: 'public/models/pcb-design/main.<ext>',
        notes: [
          'No source repository or downloadable CAD link is currently listed in project content.',
          'Need a real board/mechanical export from Kevin, preferably `.glb` or `.stl`.',
        ],
        projectId: 'pcb-design',
        projectName: 'PCB Design',
        type: 'deferred-model',
      },
    ]);
  });

  it('tracks non-featured hardware model gaps as deferred opportunities, not strict blockers', async () => {
    const { auditLaunchContent } = await loadAuditModule();
    const audit = auditLaunchContent({
      photoManifest: { photos: photos(12) },
      projectsContent: {
        projects: [
          project({
            category: 'Hardware',
            featured: false,
            id: 'pcb-design',
            name: 'PCB Design',
          }),
        ],
      },
      talkingPointsContent: { points: talkingPoints(8) },
    });

    expect(audit.blockingCount).toBe(0);
    expect(audit.assetRequests).toEqual([]);
    expect(audit.commands).toEqual([]);
    expect(audit.deferredAssetRequests).toMatchObject([
      {
        destination: 'public/models/pcb-design/main.<ext>',
        projectId: 'pcb-design',
        projectName: 'PCB Design',
        type: 'deferred-model',
      },
    ]);
    expect(audit.findings).toContainEqual({
      title: 'Deferred hardware/robotics/VR projects without 3D modelPath',
      items: ['pcb-design (PCB Design)'],
    });
  });

  it('reports the photography launch gap and add-photo command below the minimum gallery size', async () => {
    const { auditLaunchContent } = await loadAuditModule();
    const audit = auditLaunchContent({
      photoManifest: { photos: photos(6) },
      projectsContent: { projects: [project()] },
      talkingPointsContent: { points: talkingPoints(8) },
    });

    expect(audit.blockingCount).toBe(1);
    expect(audit.globalGaps).toEqual([
      'Photography has 6 photos; target at least 12-15 before treating it as a full gallery.',
    ]);
    expect(audit.commands).toEqual([
      'npm run add:photo -- --src <path-to-photo> --title <title> --location <place> --year <yyyy> --alt <accessible description> --sync',
    ]);
    expect(audit.assetRequests).toMatchObject([
      {
        currentCount: 6,
        neededCount: 6,
        targetCount: 12,
        type: 'photo',
      },
    ]);
  });

  it('passes when projects have rich media, required models, gallery depth, and talking points', async () => {
    const { auditLaunchContent } = await loadAuditModule();
    const audit = auditLaunchContent({
      photoManifest: { photos: photos(12) },
      projectsContent: {
        projects: [
          project({
            category: 'Robotics',
            id: 'robotic-arm-puppeteer',
            links: { modelPath: '/models/robotic-arm-puppeteer/main.glb' },
            name: 'Robotic Arm Puppeteer',
          }),
          project(),
        ],
      },
      talkingPointsContent: { points: talkingPoints(8) },
    });

    expect(audit.blockingCount).toBe(0);
    expect(audit.assetRequests).toEqual([]);
    expect(audit.deferredAssetRequests).toEqual([]);
    expect(audit.commands).toEqual([]);
    expect(audit.globalGaps).toEqual([]);
  });

  it('renders a durable markdown handoff for open asset requests', async () => {
    const { auditLaunchContent, renderAssetRequestsMarkdown } = await loadAuditModule();
    const audit = auditLaunchContent({
      photoManifest: { photos: photos(6) },
      projectsContent: {
        projects: [
          project({
            category: 'Robotics',
            featured: true,
            id: 'robotic-arm-puppeteer',
            media: { featuredImage: '/projects/robotic-arm/hero.png', images: ['/projects/robotic-arm/detail.png'] },
            name: 'Robotic Arm Puppeteer',
          }),
        ],
      },
      talkingPointsContent: { points: talkingPoints(8) },
    });
    const markdown = renderAssetRequestsMarkdown(audit, { generatedAt: '2026-05-20T00:00:00.000Z' });

    expect(markdown).toContain('# Launch Asset Requests');
    expect(markdown).toContain('Generated: 2026-05-20T00:00:00.000Z');
    expect(markdown).toContain('Blocking launch gaps: 1');
    expect(markdown).not.toContain('## Model Requests');
    expect(markdown).toContain('### Robotic Arm Puppeteer');
    expect(markdown).toContain('Destination: `public/models/robotic-arm-puppeteer/main.<ext>`');
    expect(markdown).toContain(
      'Note: Need a real project-owned CAD or 3D model export. Do not use generated placeholder geometry for launch.',
    );
    expect(markdown).toContain('## Photo Requests');
    expect(markdown).toContain('Needed count: 6');
    expect(markdown).toContain('## Current Findings');
  });

  it('renders deferred model opportunities separately from blocking requests', async () => {
    const { auditLaunchContent, renderAssetRequestsMarkdown } = await loadAuditModule();
    const audit = auditLaunchContent({
      photoManifest: { photos: photos(12) },
      projectsContent: {
        projects: [
          project({
            category: 'Hardware',
            featured: false,
            id: 'pcb-design',
            name: 'PCB Design',
          }),
        ],
      },
      talkingPointsContent: { points: talkingPoints(8) },
    });
    const markdown = renderAssetRequestsMarkdown(audit);

    expect(markdown).toContain('Blocking launch gaps: 0');
    expect(markdown).toContain('No launch asset requests are open.');
    expect(markdown).toContain('## Deferred Model Opportunities');
    expect(markdown).toContain('### PCB Design');
  });

  it('uses a deterministic generated label by default', async () => {
    const { auditLaunchContent, renderAssetRequestsMarkdown } = await loadAuditModule();
    const audit = auditLaunchContent({
      photoManifest: { photos: photos(12) },
      projectsContent: { projects: [project()] },
      talkingPointsContent: { points: talkingPoints(8) },
    });
    const markdown = renderAssetRequestsMarkdown(audit);

    expect(markdown).toContain('Generated: current content snapshot');
  });
});
