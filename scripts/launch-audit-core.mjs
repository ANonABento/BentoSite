export const MIN_LAUNCH_PHOTOS = 12;
export const MIN_LAUNCH_TALKING_POINTS = 8;
export const DEFAULT_REPORT_GENERATED_AT = 'current content snapshot';

export function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function projectMediaCount(project) {
  return [
    project.media?.featuredImage,
    ...(project.media?.images ?? []),
    project.media?.video,
    project.media?.pdf,
    project.media?.website,
    project.media?.game?.url,
    project.links?.modelPath,
  ].filter(Boolean).length;
}

export function expectsModel(project) {
  const category = String(project.category ?? '').toLowerCase();
  const text = `${project.name ?? ''} ${project.shortDescription ?? ''}`.toLowerCase();
  return (
    category.includes('robotics') ||
    category === 'hardware' ||
    category === 'vr/ar' ||
    /\b(robot|robotic|pcb|cad|haptic|gesture|exoskeleton|arm)\b/.test(text)
  );
}

const MODEL_REQUEST_NOTES = {
  'ar-gesture-robot': [
    'Checked linked GitHub repo `KushalPraja/kenesis`; no viewer-compatible `.glb`, `.gltf`, or `.stl` files were present.',
    'Need a real robot assembly/export from Kevin or a source-controlled CAD export.',
  ],
  'expressive-ai-robot-head': [
    'Checked linked GitHub repo `MaidReal/Head`; no viewer-compatible `.glb`, `.gltf`, or `.stl` files were present.',
    'Need a real head/mechanism CAD export from Kevin or the original design files.',
  ],
  'pcb-design': [
    'No source repository or downloadable CAD link is currently listed in project content.',
    'Need a real board/mechanical export from Kevin, preferably `.glb` or `.stl`.',
  ],
  'vr-haptic-gloves': [
    'No source repository or downloadable CAD link is currently listed in project content.',
    'Need a real glove/mechanism model export from Kevin, preferably `.glb` or `.stl`.',
  ],
  'ftc-robotics': [
    'Checked linked GitHub repo `ANonABento/19498-Devolotics-Centerstage-2023-2024`; no viewer-compatible `.glb`, `.gltf`, or `.stl` files were present.',
    'Need a real robot CAD/export from Kevin or the team CAD source.',
  ],
};

function formatProject(project) {
  return `${project.id} (${project.name})`;
}

function modelRequest(project) {
  return {
    command: `npm run add:model -- --project ${project.id} --src <path-to-real-model.glb-or-stl> --sync`,
    destination: `public/models/${project.id}/main.<ext>`,
    notes: MODEL_REQUEST_NOTES[project.id] ?? [
      'Need a real project-owned CAD or 3D model export. Do not use generated placeholder geometry for launch.',
    ],
    projectId: project.id,
    projectName: project.name,
    reason: 'Featured hardware/robotics/VR projects should expose a real CAD or 3D model in Viewfinder before launch.',
    type: 'model',
  };
}

function deferredModelRequest(project) {
  return {
    ...modelRequest(project),
    reason: 'Hardware/robotics/VR projects can ship with rich image coverage, but should get real CAD or 3D models in a later asset pass.',
    type: 'deferred-model',
  };
}

function photoRequest(currentCount) {
  return {
    command:
      'npm run add:photo -- --src <path-to-photo> --title <title> --location <place> --year <yyyy> --alt <accessible description> --sync',
    currentCount,
    neededCount: Math.max(0, MIN_LAUNCH_PHOTOS - currentCount),
    reason: 'Photography needs at least 12 real photos before treating /photography as a full gallery.',
    targetCount: MIN_LAUNCH_PHOTOS,
    type: 'photo',
  };
}

export function auditLaunchContent({ projectsContent, photoManifest, talkingPointsContent }) {
  const projects = projectsContent.projects ?? [];
  const photos = photoManifest.photos ?? [];
  const talkingPoints = talkingPointsContent.points ?? [];
  const deferredProjectsMissingModels = projects.filter((project) => expectsModel(project) && !project.links?.modelPath);

  const missingHero = projects
    .filter((project) => !hasText(project.media?.featuredImage) && !hasText(project.thumbnail))
    .map(formatProject);
  const noRichMedia = projects
    .filter((project) => projectMediaCount(project) === 0)
    .map(formatProject);
  const featuredWithoutRichMedia = projects
    .filter((project) => project.featured && projectMediaCount(project) <= 1)
    .map(formatProject);
  const deferredNoModel = deferredProjectsMissingModels.map(formatProject);
  const weakDescriptions = projects
    .filter((project) => !hasText(project.description) || project.description.length < 240)
    .map(formatProject);

  const globalGaps = [];
  if (photos.length < MIN_LAUNCH_PHOTOS) {
    globalGaps.push(`Photography has ${photos.length} photos; target at least 12-15 before treating it as a full gallery.`);
  }
  if (talkingPoints.length < MIN_LAUNCH_TALKING_POINTS) {
    globalGaps.push(`Chat has ${talkingPoints.length} talking points; target at least 8-10 personal/FAQ entries.`);
  }

  const findings = [
    { title: 'Projects missing hero/thumbnail', items: missingHero },
    { title: 'Projects with no rich media at all', items: noRichMedia },
    { title: 'Featured projects with thin media', items: featuredWithoutRichMedia },
    { title: 'Deferred hardware/robotics/VR projects without 3D modelPath', items: deferredNoModel },
    { title: 'Projects with short/missing long descriptions', items: weakDescriptions },
  ];

  const blockingCount =
    missingHero.length +
    noRichMedia.length +
    featuredWithoutRichMedia.length +
    weakDescriptions.length +
    globalGaps.length;
  const assetRequests = [
    ...(photos.length < MIN_LAUNCH_PHOTOS ? [photoRequest(photos.length)] : []),
  ];
  const deferredAssetRequests = deferredProjectsMissingModels.map(deferredModelRequest);

  return {
    assetRequests,
    blockingCount,
    commands: assetRequests.map((request) => request.command),
    counts: {
      photos: photos.length,
      projects: projects.length,
      talkingPoints: talkingPoints.length,
    },
    deferredAssetRequests,
    findings,
    globalGaps,
  };
}

export function getAssetCommands({ noModel, photosNeeded }) {
  const commands = [];

  for (const item of noModel) {
    const projectId = item.split(' ', 1)[0];
    commands.push(`npm run add:model -- --project ${projectId} --src <path-to-real-model.glb-or-stl> --sync`);
  }

  if (photosNeeded > 0) {
    commands.push(
      `npm run add:photo -- --src <path-to-photo> --title <title> --location <place> --year <yyyy> --alt <accessible description> --sync`,
    );
  }

  return commands;
}

export function renderAssetRequestsMarkdown(audit, { generatedAt = DEFAULT_REPORT_GENERATED_AT } = {}) {
  const lines = [
    '# Launch Asset Requests',
    '',
    `Generated: ${generatedAt}`,
    '',
    'This report is generated from `npm run launch:audit:json`. It lists the real Kevin-owned assets still needed before strict launch readiness can pass.',
    '',
    '## Summary',
    '',
    `- Blocking launch gaps: ${audit.blockingCount}`,
    `- Projects: ${audit.counts.projects}`,
    `- Photos: ${audit.counts.photos}`,
    `- Talking points: ${audit.counts.talkingPoints}`,
    '',
  ];

  const deferredModelRequests = audit.deferredAssetRequests?.filter((request) => request.type === 'deferred-model') ?? [];

  if (audit.assetRequests.length === 0 && deferredModelRequests.length === 0) {
    lines.push('## Requests', '', 'No launch asset requests are open.', '');
    return `${lines.join('\n')}\n`;
  }

  const modelRequests = audit.assetRequests.filter((request) => request.type === 'model');
  const photoRequests = audit.assetRequests.filter((request) => request.type === 'photo');

  if (audit.assetRequests.length === 0) {
    lines.push('## Requests', '', 'No launch asset requests are open.', '');
  }

  if (modelRequests.length > 0) {
    lines.push('## Model Requests', '');
    for (const request of modelRequests) {
      lines.push(
        `### ${request.projectName}`,
        '',
        `- Project ID: \`${request.projectId}\``,
        `- Destination: \`${request.destination}\``,
        `- Reason: ${request.reason}`,
        ...request.notes.map((note) => `- Note: ${note}`),
        `- Command: \`${request.command}\``,
        '',
      );
    }
  }

  if (photoRequests.length > 0) {
    lines.push('## Photo Requests', '');
    for (const request of photoRequests) {
      lines.push(
        '### Photography Gallery',
        '',
        `- Current count: ${request.currentCount}`,
        `- Target count: ${request.targetCount}`,
        `- Needed count: ${request.neededCount}`,
        `- Reason: ${request.reason}`,
        `- Command: \`${request.command}\``,
        '',
      );
    }
  }

  if (deferredModelRequests.length > 0) {
    lines.push('## Deferred Model Opportunities', '');
    for (const request of deferredModelRequests) {
      lines.push(
        `### ${request.projectName}`,
        '',
        `- Project ID: \`${request.projectId}\``,
        `- Destination: \`${request.destination}\``,
        `- Reason: ${request.reason}`,
        ...request.notes.map((note) => `- Note: ${note}`),
        `- Command: \`${request.command}\``,
        '',
      );
    }
  }

  lines.push('## Current Findings', '');
  for (const finding of audit.findings) {
    lines.push(`### ${finding.title}`, '');
    if (finding.items.length === 0) {
      lines.push('- none', '');
      continue;
    }
    for (const item of finding.items) lines.push(`- ${item}`);
    lines.push('');
  }

  lines.push('### Global launch gaps needing Kevin/assets', '');
  if (audit.globalGaps.length === 0) {
    lines.push('- none', '');
  } else {
    for (const item of audit.globalGaps) lines.push(`- ${item}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
