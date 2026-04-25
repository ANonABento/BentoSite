'use client';

import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { DEFAULTS, STORAGE_KEYS } from '@/lib/constants';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/lib/utils';
import type { Message } from './chat.types';

export function getDefaultMessage(): Message {
  return {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm ${PORTFOLIO_DATA.personal.name}'s AI assistant. I can tell you about their skills, projects, and experience. What would you like to know?`,
    timestamp: Date.now(),
  };
}

export function getClearedMessage(): Message {
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: `Chat cleared! I'm ${PORTFOLIO_DATA.personal.name}'s AI assistant. What would you like to know?`,
    timestamp: Date.now(),
  };
}

export function isValidMessage(message: unknown): message is Message {
  return (
    message !== null &&
    typeof message === 'object' &&
    'id' in message &&
    typeof message.id === 'string' &&
    'role' in message &&
    (message.role === 'user' || message.role === 'assistant') &&
    'content' in message &&
    typeof message.content === 'string' &&
    'timestamp' in message &&
    typeof message.timestamp === 'number' &&
    Number.isFinite(message.timestamp) &&
    (
      !('feedback' in message) ||
      message.feedback === null ||
      message.feedback === 'positive' ||
      message.feedback === 'negative'
    )
  );
}

export function loadMessages(): Message[] | null {
  const stored = getStorageItem<unknown[]>(STORAGE_KEYS.CHAT_HISTORY, []);
  if (!Array.isArray(stored) || stored.length === 0) {
    return null;
  }

  const validMessages = stored.filter(isValidMessage);
  return validMessages.length > 0 ? validMessages : null;
}

export function saveMessages(messages: Message[]): void {
  const messagesToStore = messages.slice(-DEFAULTS.MAX_CHAT_MESSAGES);
  setStorageItem(STORAGE_KEYS.CHAT_HISTORY, messagesToStore);
}

export function clearStoredMessages(): void {
  removeStorageItem(STORAGE_KEYS.CHAT_HISTORY);
}
