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

export function checkChatGuardrails(message: string): GuardrailResult {
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

  const onTopic = PUBLIC_TOPICS.some((topic) => topic && normalized.includes(topic));
  if (!onTopic && retrievePortfolioContext(message, 1).length === 0) {
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
