import { PORTFOLIO_DATA } from '@/lib/chat-knowledge';

export { PORTFOLIO_DATA };

// Build a pool of candidate questions sourced from portfolio data. The
// chat surface shuffles + slices this on each mount so visitors see a
// different rotation each visit.
function buildSuggestedQuestionPool(): string[] {
  const pool: string[] = [];

  const featured = PORTFOLIO_DATA.projects.filter((p) => p.featured);
  featured.forEach((project) => {
    pool.push(`Tell me about ${project.name}`);
    pool.push(`How does ${project.name} work?`);
  });

  const topHw = PORTFOLIO_DATA.skills.hardware[0];
  if (topHw) pool.push(`What's your experience with ${topHw}?`);
  const topSw = PORTFOLIO_DATA.skills.software[0];
  if (topSw) pool.push(`Where do you use ${topSw}?`);

  pool.push(
    "What's your robotics experience?",
    'What are you working on right now?',
    'What got you into robotics?',
    'Tell me about your education',
    'What is bentOS?',
    'Are you open to opportunities?',
    'What was your favorite project?',
    'Show me something unexpected',
  );

  // De-dupe while keeping insertion order.
  return Array.from(new Set(pool));
}

export const SUGGESTED_QUESTION_POOL = buildSuggestedQuestionPool();
