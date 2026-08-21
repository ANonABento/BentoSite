export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatFunctions {
  send: (content: string) => void;
  addAssistant: (content: string) => void;
  clear: () => void;
  focusInput: () => void;
}

export interface ChatbotProps {
  onReady?: (fns: ChatFunctions) => void;
  onUserMessage?: () => void;
  /** Name of the project the surrounding dashboard is showing, if any. */
  projectName?: string;
}
