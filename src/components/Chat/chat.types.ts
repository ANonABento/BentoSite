export type MessageRole = 'user' | 'assistant';
export type MessageFeedback = 'positive' | 'negative';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  feedback?: MessageFeedback | null;
}

export interface ChatResponse {
  message?: string;
  error?: string;
  isDemoMode?: boolean;
}

export interface ChatFunctions {
  send: (content: string) => void;
  addAssistant: (content: string) => void;
  clear: () => void;
}

export interface ChatbotProps {
  onReady?: (fns: ChatFunctions) => void;
  onViewResume?: () => void;
  onSeeProjects?: () => void;
}
