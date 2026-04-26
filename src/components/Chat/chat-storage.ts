import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { DEFAULTS, STORAGE_KEYS } from '@/lib/constants';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/lib/utils';
import type { Message } from './chat.types';

function isValidMessage(message: unknown): message is Message {
  return (
    message !== null &&
    typeof message === 'object' &&
    'id' in message &&
    'role' in message &&
    'content' in message &&
    'timestamp' in message
  );
}

export function createDefaultMessage(): Message {
  return {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm ${PORTFOLIO_DATA.personal.name}'s AI assistant. I can tell you about their skills, projects, and experience. What would you like to know?`,
    timestamp: Date.now(),
  };
}

export function loadStoredMessages(): Message[] | null {
  const stored = getStorageItem<unknown[]>(STORAGE_KEYS.CHAT_HISTORY, []);
  if (!Array.isArray(stored) || stored.length === 0) {
    return null;
  }

  const validMessages = stored.filter(isValidMessage);
  return validMessages.length > 0 ? validMessages : null;
}

export function saveStoredMessages(messages: Message[]): void {
  setStorageItem(
    STORAGE_KEYS.CHAT_HISTORY,
    messages.slice(-DEFAULTS.MAX_CHAT_MESSAGES)
  );
}

export function clearStoredMessages(): void {
  removeStorageItem(STORAGE_KEYS.CHAT_HISTORY);
}
