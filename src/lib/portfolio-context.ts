import { PORTFOLIO_DATA } from '@/lib/chat-knowledge';

export { PORTFOLIO_DATA };

// Generate dynamic suggested questions from portfolio data
function generateSuggestedQuestions(): string[] {
  const questions: string[] = [];

  // Add questions about featured projects
  const featured = PORTFOLIO_DATA.projects.filter(p => p.featured);
  if (featured.length > 0) {
    const project = featured[0];
    questions.push(`Tell me about ${project.name}`);
  }
  if (featured.length > 1) {
    const project = featured[1];
    questions.push(`How does ${project.name} work?`);
  }

  // Add a general experience question
  questions.push("What's your robotics experience?");

  // Add a technology question based on top skills
  const topTech = PORTFOLIO_DATA.skills.hardware[0];
  if (topTech) {
    questions.push(`Tell me about your ${topTech} projects`);
  }

  return questions.slice(0, 4); // Limit to 4 questions
}

// Suggested questions for the chat interface
export const SUGGESTED_QUESTIONS = generateSuggestedQuestions();
