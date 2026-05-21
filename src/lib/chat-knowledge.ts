import portfolioContent from '@/content/portfolio.json';
import talkingPointsContent from '@/content/talking-points.generated.json';
import { PROJECTS } from '@/lib/projects-data';

interface TalkingPoint {
  id: string;
  title: string;
  content: string;
  keywords?: string[];
}

const TALKING_POINTS: TalkingPoint[] =
  (talkingPointsContent as { points?: TalkingPoint[] }).points ?? [];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface KnowledgeSection {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

interface GuardrailResult {
  allowed: boolean;
  response?: string;
}

type PortfolioContent = typeof portfolioContent;

const content = portfolioContent as PortfolioContent;

export const PORTFOLIO_DATA = {
  ...content,
  projects: PROJECTS.map((project) => ({
    id: project.id,
    name: project.name,
    shortDescription: project.shortDescription,
    description: project.description || project.shortDescription,
    technologies: project.technologies,
    category: project.category,
    github: project.links?.github,
    links: project.links,
    media: project.media,
    featured: Boolean(project.featured),
    status: project.status,
    dateCompleted: project.dateCompleted,
  })),
};

const PUBLIC_TOPICS = [
  'about',
  'background',
  'bio',
  'contact',
  'degree',
  'education',
  'email',
  'experience',
  'github',
  'hackathon',
  'hardware',
  'kevin',
  'linkedin',
  'portfolio',
  'project',
  'resume',
  'robot',
  'robotics',
  'school',
  'skill',
  'software',
  'university',
  'waterloo',
  ...PORTFOLIO_DATA.skills.hardware,
  ...PORTFOLIO_DATA.skills.software,
  ...PORTFOLIO_DATA.skills.tools,
  ...PORTFOLIO_DATA.projects.flatMap((project) => [
    project.name,
    project.category,
    ...project.technologies,
  ]),
  ...TALKING_POINTS.flatMap((point) => [point.title, ...(point.keywords ?? [])]),
]
  .map(normalizeText)
  .filter((topic) => topic.length > 2);

const STOP_WORDS = new Set([
  'a',
  'about',
  'all',
  'am',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'can',
  'do',
  'does',
  'for',
  'from',
  'have',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'more',
  'of',
  'on',
  'or',
  'tell',
  'that',
  'the',
  'their',
  'this',
  'to',
  'what',
  'with',
  'you',
  'your',
]);

const BLOCKED_PATTERNS = [
  /api\s*key/i,
  /password/i,
  /private\s+(address|phone|email|data|information)/i,
  /secret/i,
  /system\s+prompt/i,
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /reveal\s+(your|the)\s+(prompt|instructions)/i,
];

const GREETING_PATTERN = /^(hi|hello|hey|yo|sup|thanks|thank you|who are you)[\s!.?]*$/i;
const FOLLOW_UP_PATTERN =
  /\b(that|those|these|it|they|them|this|compare|comparison|tradeoff|tradeoffs|why|how|built|work|works|different|difference|change|improve|favorite|unexpected)\b/i;
const OFF_TOPIC_TASK_PATTERN =
  /\b(recipe|homework|essay|poem|song|legal advice|medical advice|stock pick|weather|sports score|translate|summarize this article)\b/i;

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function projectToSection(project: (typeof PORTFOLIO_DATA.projects)[number]): KnowledgeSection {
  const lines = [
    `Name: ${project.name}`,
    `Category: ${project.category}`,
    `Status: ${project.status}`,
    project.dateCompleted ? `Date: ${project.dateCompleted}` : '',
    `Summary: ${project.shortDescription}`,
    `Details: ${project.description}`,
    `Technologies: ${project.technologies.join(', ')}`,
    project.github ? `GitHub: ${project.github}` : '',
  ].filter(Boolean);

  return {
    id: `project:${project.id}`,
    title: `Project: ${project.name}`,
    content: lines.join('\n'),
    keywords: [
      project.name,
      project.category,
      project.status,
      project.shortDescription,
      project.description,
      ...project.technologies,
    ].flatMap(tokenize),
  };
}

function buildKnowledgeSections(): KnowledgeSection[] {
  return [
    {
      id: 'profile',
      title: 'Profile',
      content: [
        `Name: ${PORTFOLIO_DATA.personal.name}`,
        `Title: ${PORTFOLIO_DATA.personal.title}`,
        `Location: ${PORTFOLIO_DATA.personal.location}`,
        `Education: ${PORTFOLIO_DATA.personal.degree} at ${PORTFOLIO_DATA.personal.university}`,
        `About: ${PORTFOLIO_DATA.about}`,
      ].join('\n'),
      keywords: tokenize(
        `${PORTFOLIO_DATA.personal.name} ${PORTFOLIO_DATA.personal.title} ${PORTFOLIO_DATA.about}`
      ),
    },
    {
      id: 'skills',
      title: 'Skills',
      content: [
        `Hardware: ${PORTFOLIO_DATA.skills.hardware.join(', ')}`,
        `Software: ${PORTFOLIO_DATA.skills.software.join(', ')}`,
        `Tools: ${PORTFOLIO_DATA.skills.tools.join(', ')}`,
      ].join('\n'),
      keywords: [
        ...PORTFOLIO_DATA.skills.hardware,
        ...PORTFOLIO_DATA.skills.software,
        ...PORTFOLIO_DATA.skills.tools,
      ].flatMap(tokenize),
    },
    {
      id: 'experience',
      title: 'Experience',
      content: PORTFOLIO_DATA.experience
        .map((entry) =>
          [
            `${entry.role} at ${entry.company}`,
            'location' in entry && entry.location ? `Location: ${entry.location}` : '',
            `Period: ${entry.period}`,
            `Details: ${entry.description}`,
          ].filter(Boolean).join('\n')
        )
        .join('\n\n'),
      keywords: PORTFOLIO_DATA.experience
        .flatMap((entry) => [entry.company, entry.role, entry.description])
        .flatMap(tokenize),
    },
    {
      id: 'education',
      title: 'Education',
      content: PORTFOLIO_DATA.education
        .map((entry) => `${entry.degree} at ${entry.institution} (${entry.period})`)
        .join('\n'),
      keywords: PORTFOLIO_DATA.education
        .flatMap((entry) => [entry.degree, entry.institution, entry.period])
        .flatMap(tokenize),
    },
    {
      id: 'contact',
      title: 'Public Contact',
      content: [
        `Email: ${PORTFOLIO_DATA.personal.email}`,
        `GitHub: ${PORTFOLIO_DATA.personal.github}`,
        `LinkedIn: ${PORTFOLIO_DATA.personal.linkedin}`,
      ].join('\n'),
      keywords: tokenize('contact email github linkedin reach hire message'),
    },
    ...PORTFOLIO_DATA.projects.map(projectToSection),
    ...TALKING_POINTS.map((point) => ({
      id: `talking-point:${point.id}`,
      title: point.title,
      content: point.content,
      keywords: [
        point.title,
        point.content,
        ...(point.keywords ?? []),
      ].flatMap(tokenize),
    })),
  ];
}

const KNOWLEDGE_SECTIONS = buildKnowledgeSections();

export function getLatestUserMessage(messages: ChatMessage[]): string {
  return [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
}

export function buildRetrievalQuery(messages: ChatMessage[], maxMessages = 8): string {
  const latestUserMessage = getLatestUserMessage(messages);
  const recentContext = messages
    .slice(-maxMessages)
    .map((message) => message.content)
    .join('\n');

  return [latestUserMessage, recentContext].filter(Boolean).join('\n\n');
}

export function checkChatGuardrails(message: string, contextQuery = message): GuardrailResult {
  const normalized = normalizeText(message);

  if (!normalized) {
    return {
      allowed: false,
      response: `Ask me about ${PORTFOLIO_DATA.personal.name}'s projects, skills, experience, education, or public contact info.`,
    };
  }

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(message))) {
    return {
      allowed: false,
      response:
        "I can't help with private data, secrets, credentials, or system instructions. I can answer questions about Kevin's public portfolio, projects, skills, experience, and contact links.",
    };
  }

  if (GREETING_PATTERN.test(message)) {
    return { allowed: true };
  }

  if (OFF_TOPIC_TASK_PATTERN.test(message)) {
    return {
      allowed: false,
      response:
        "I only handle Kevin's public portfolio information here. Try asking about his projects, robotics work, software skills, education, experience, or contact links.",
    };
  }

  const onTopic = PUBLIC_TOPICS.some((topic) => topic && normalized.includes(topic));
  const contextAwareFollowUp =
    FOLLOW_UP_PATTERN.test(message) &&
    retrievePortfolioContext(contextQuery, 1).length > 0;

  if (!onTopic && !contextAwareFollowUp && retrievePortfolioContext(message, 1).length === 0) {
    return {
      allowed: false,
      response:
        "I only answer from Kevin's public portfolio information. Try asking about his robotics projects, software skills, experience, education, or how to contact him.",
    };
  }

  return { allowed: true };
}

export function retrievePortfolioContext(query: string, limit = 7): KnowledgeSection[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return KNOWLEDGE_SECTIONS.slice(0, Math.min(limit, 3));
  }

  return KNOWLEDGE_SECTIONS.map((section) => {
    const sectionText = normalizeText(`${section.title} ${section.content}`);
    const score = queryTokens.reduce((total, token) => {
      if (section.keywords.includes(token)) return total + 4;
      if (sectionText.includes(token)) return total + 1;
      return total;
    }, 0);

    return { section, score };
  })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.section);
}

export function getDefaultPortfolioContext(limit = 4): KnowledgeSection[] {
  const preferredIds = ['profile', 'skills', 'experience', 'contact'];
  return preferredIds
    .map((id) => KNOWLEDGE_SECTIONS.find((section) => section.id === id))
    .filter((section): section is KnowledgeSection => Boolean(section))
    .slice(0, limit);
}

export function formatRetrievedContext(sections: KnowledgeSection[]): string {
  return sections
    .map((section) => `## ${section.title}\n${section.content}`)
    .join('\n\n');
}

export function buildAssistantInstructions(context: string): string {
  return `You are the portfolio assistant for ${PORTFOLIO_DATA.personal.name}.

Use only the verified portfolio context below. If the context does not contain the answer, say you do not have that information and offer a related public detail or contact link. Do not infer private details, credentials, unreleased plans, grades, claims, metrics, or employment status unless they are explicitly present in the context.

Style:
- Be concise and specific.
- Speak in the third person about Kevin unless the user asks for contact copy.
- Prefer concrete project and technology details over generic praise.
- Use markdown only when it improves readability.

Verified portfolio context:
${context}`;
}

// ---------------------------------------------------------------------------
// Canned starter responses
// ---------------------------------------------------------------------------
// For predictable opener queries (suggested-question chips, project-card
// rundowns, etc.) we return a deterministic response WITHOUT calling the LLM.
// Saves Gemini quota, ~1s of latency, and guarantees the same wording every
// time someone clicks the same chip. Follow-up questions still hit the LLM,
// which sees the canned response as prior assistant context.

function formatProjectRundown(project: (typeof PORTFOLIO_DATA.projects)[number]): string {
  const lines: string[] = [
    `**${project.name}** — ${project.category}`,
    '',
    project.shortDescription,
  ];

  if (project.description && project.description !== project.shortDescription) {
    lines.push('', '**What it does**', project.description);
  }

  if (project.technologies && project.technologies.length > 0) {
    lines.push('', '**Tech stack**', project.technologies.join(', '));
  }

  const meta: string[] = [];
  if (project.status) meta.push(`Status: ${project.status}`);
  if (project.dateCompleted) meta.push(`Date: ${project.dateCompleted}`);
  if (meta.length > 0) {
    lines.push('', meta.join(' · '));
  }

  const links: string[] = [];
  if (project.github) links.push(`[GitHub](${project.github})`);
  links.push(`[Project page](/projects/${project.id})`);
  lines.push('', links.join(' · '));

  lines.push(
    '',
    '_Ask a follow-up for deeper detail — how it was built, specific tradeoffs, what would change with more time, etc._',
  );

  return lines.join('\n');
}

function formatRoboticsSummary(): string {
  const roboticsProjects = PORTFOLIO_DATA.projects.filter((project) =>
    /robot|robotic/i.test(`${project.category} ${project.shortDescription} ${project.description}`),
  );
  const roboticsExperience = PORTFOLIO_DATA.experience.filter((entry) =>
    /robot|robotic/i.test(`${entry.role} ${entry.description}`),
  );

  const lines: string[] = ['**Robotics experience**', ''];

  if (roboticsExperience.length > 0) {
    lines.push('**Industry**');
    for (const entry of roboticsExperience) {
      lines.push(`- ${entry.role} at ${entry.company} (${entry.period}) — ${entry.description}`);
    }
    lines.push('');
  }

  if (roboticsProjects.length > 0) {
    lines.push('**Projects**');
    for (const project of roboticsProjects) {
      lines.push(`- **${project.name}** — ${project.shortDescription}`);
    }
    lines.push('');
  }

  lines.push('_Ask about any specific project, technology, or experience for the full story._');
  return lines.join('\n');
}

function formatTechProjects(tech: string): string {
  const matching = PORTFOLIO_DATA.projects.filter((project) =>
    project.technologies.some((projectTech) =>
      normalizeText(projectTech) === normalizeText(tech),
    ),
  );

  if (matching.length === 0) {
    return `No projects in the portfolio explicitly tagged with ${tech}. Ask me what Kevin has used it for, or pick a project to dive into.`;
  }

  const lines: string[] = [`**${tech} projects**`, ''];
  for (const project of matching) {
    const link = project.github
      ? ` ([GitHub](${project.github}))`
      : '';
    lines.push(`- **${project.name}** — ${project.shortDescription}${link}`);
  }
  lines.push('', '_Ask for deeper detail on any of these._');
  return lines.join('\n');
}

function formatEducationSummary(): string {
  const lines = ['**Education**', ''];
  for (const entry of PORTFOLIO_DATA.education) {
    lines.push(`- ${entry.degree} at ${entry.institution} (${entry.period})`);
  }
  lines.push('', `${PORTFOLIO_DATA.personal.name} is based in ${PORTFOLIO_DATA.personal.location}.`);
  return lines.join('\n');
}

function formatCurrentWorkSummary(): string {
  const activeProjects = PORTFOLIO_DATA.projects.filter((project) =>
    /progress|active|ongoing/i.test(project.status),
  );
  const lines = ['**Current work**', ''];

  if (activeProjects.length > 0) {
    for (const project of activeProjects.slice(0, 6)) {
      lines.push(`- **${project.name}** — ${project.shortDescription}`);
    }
  } else {
    lines.push(
      `${PORTFOLIO_DATA.personal.name} is focused on robotics, hardware prototyping, AI tooling, and this portfolio system.`,
    );
  }

  lines.push('', '_Ask about a specific project for implementation details._');
  return lines.join('\n');
}

function formatRoboticsOriginSummary(): string {
  return [
    '**Robotics focus**',
    '',
    PORTFOLIO_DATA.about,
    '',
    "The public portfolio frames Kevin's robotics interest around full-stack physical systems: CAD and mechanisms, electronics, embedded control, perception, ROS2, and AI behavior.",
  ].join('\n');
}

function formatFavoriteProjectSummary(): string {
  const featuredProjects = PORTFOLIO_DATA.projects.filter((project) => project.featured).slice(0, 4);
  const lines = [
    '**Representative projects**',
    '',
    "The portfolio does not name a single favorite project. These are the strongest public starting points:",
  ];

  for (const project of featuredProjects) {
    lines.push(`- **${project.name}** — ${project.shortDescription}`);
  }

  lines.push('', '_Ask about one of them for a deeper breakdown._');
  return lines.join('\n');
}

function formatUnexpectedSummary(): string {
  const candidates = PORTFOLIO_DATA.projects.filter((project) =>
    /taser|dating|sloth|dead internet|haptic|puppeteer|gesture/i.test(
      `${project.name} ${project.shortDescription} ${project.description}`,
    ),
  ).slice(0, 5);
  const lines = ['**Unexpected corners of the portfolio**', ''];

  for (const project of candidates) {
    lines.push(`- **${project.name}** — ${project.shortDescription}`);
  }

  lines.push('', '_Pick one and I can unpack how it works._');
  return lines.join('\n');
}

function formatOpportunitySummary(): string {
  const contact = PORTFOLIO_DATA.personal;
  return [
    `Yes — for public contact, reach ${contact.name} at ${contact.email}.`,
    '',
    `GitHub: ${contact.github}`,
    `LinkedIn: ${contact.linkedin}`,
  ].join('\n');
}

function findProjectByNormalizedName(name: string) {
  const normalizedName = normalizeText(name);
  return PORTFOLIO_DATA.projects.find((project) => normalizeText(project.name) === normalizedName);
}

const STARTER_RESPONSES: Map<string, string> = (() => {
  const map = new Map<string, string>();

  // Project rundowns — match the exact text the suggested-question chips
  // send, plus a few natural variants.
  for (const project of PORTFOLIO_DATA.projects) {
    const rundown = formatProjectRundown(project);
    const triggers = [
      `Tell me about ${project.name}`,
      `How does ${project.name} work?`,
      `How does ${project.name} work`,
      `What is ${project.name}?`,
      `What is ${project.name}`,
      `Tell me about the ${project.name}`,
      project.name,
    ];
    for (const trigger of triggers) {
      map.set(normalizeText(trigger), rundown);
    }
  }

  // "What's your robotics experience?" — generated robotics overview
  for (const trigger of [
    "What's your robotics experience?",
    'What is your robotics experience?',
    'Tell me about your robotics experience',
    'Robotics experience',
  ]) {
    map.set(normalizeText(trigger), formatRoboticsSummary());
  }

  // "Tell me about your <tech> projects" — for top hardware/software skills
  // that appear in the suggested-question rotation
  const candidateTechs = [
    ...PORTFOLIO_DATA.skills.hardware,
    ...PORTFOLIO_DATA.skills.software,
  ];
  for (const tech of candidateTechs) {
    const summary = formatTechProjects(tech);
    for (const trigger of [
      `Tell me about your ${tech} projects`,
      `Tell me about your ${tech} project`,
      `What ${tech} projects do you have?`,
      `${tech} projects`,
      `What's your experience with ${tech}?`,
      `What is your experience with ${tech}?`,
      `Where do you use ${tech}?`,
    ]) {
      map.set(normalizeText(trigger), summary);
    }
  }

  for (const trigger of [
    'Tell me about your education',
    'What is your education?',
    'Where do you go to school?',
    'What school do you go to?',
  ]) {
    map.set(normalizeText(trigger), formatEducationSummary());
  }

  for (const trigger of [
    'What are you working on right now?',
    'What are you currently working on?',
    'Current work',
  ]) {
    map.set(normalizeText(trigger), formatCurrentWorkSummary());
  }

  for (const trigger of [
    'What got you into robotics?',
    'Why robotics?',
    'Tell me about your robotics focus',
  ]) {
    map.set(normalizeText(trigger), formatRoboticsOriginSummary());
  }

  for (const trigger of [
    'What was your favorite project?',
    'Favorite project',
    'What project should I look at first?',
  ]) {
    map.set(normalizeText(trigger), formatFavoriteProjectSummary());
  }

  for (const trigger of [
    'Show me something unexpected',
    'Something unexpected',
    'Show me a weird project',
  ]) {
    map.set(normalizeText(trigger), formatUnexpectedSummary());
  }

  for (const trigger of [
    'Are you open to opportunities?',
    'Are you available?',
    'How can I contact you?',
    'Contact Kevin',
  ]) {
    map.set(normalizeText(trigger), formatOpportunitySummary());
  }

  const bentos = findProjectByNormalizedName('bentOS — This Portfolio');
  if (bentos) {
    const rundown = formatProjectRundown(bentos);
    for (const trigger of ['What is bentOS?', 'Tell me about bentOS', 'bentOS']) {
      map.set(normalizeText(trigger), rundown);
    }
  }

  return map;
})();

export function getStarterResponse(query: string): string | null {
  return STARTER_RESPONSES.get(normalizeText(query)) ?? null;
}

export function createDemoResponse(message: string, context: string): string {
  const normalized = normalizeText(message);

  if (GREETING_PATTERN.test(message)) {
    return `Hello. I can answer from ${PORTFOLIO_DATA.personal.name}'s public portfolio: projects, robotics work, skills, experience, education, and contact info.`;
  }

  if (normalized.includes('contact') || normalized.includes('email') || normalized.includes('reach')) {
    return `You can reach ${PORTFOLIO_DATA.personal.name} at ${PORTFOLIO_DATA.personal.email}. Public links: GitHub ${PORTFOLIO_DATA.personal.github} and LinkedIn ${PORTFOLIO_DATA.personal.linkedin}.`;
  }

  const sections = retrievePortfolioContext(message, 3);
  const project = sections.find((section) => section.id.startsWith('project:'));
  if (project) {
    return project.content
      .split('\n')
      .filter((line) => /^(Name|Category|Summary|Details|Technologies|GitHub):/.test(line))
      .join('\n');
  }

  if (context) {
    return `I found relevant portfolio context, but live AI is not configured. Here are the grounded details I can share:\n\n${context}`;
  }

  return `I do not have that information in ${PORTFOLIO_DATA.personal.name}'s public portfolio yet. For the most accurate answer, contact ${PORTFOLIO_DATA.personal.email}.`;
}
