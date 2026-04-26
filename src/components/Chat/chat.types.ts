export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  feedback?: 'positive' | 'negative' | null;
}

export interface ChatFunctions {
  send: (content: string) => void;
  addAssistant: (content: string) => void;
  clear: () => void;
  focusInput: () => void;
}

export interface ChatbotProps {
  onReady?: (fns: ChatFunctions) => void;
  onViewResume?: () => void;
  onSeeProjects?: () => void;
}
