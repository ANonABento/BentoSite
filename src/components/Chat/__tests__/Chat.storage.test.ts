import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULTS, STORAGE_KEYS } from '@/lib/constants';
import { clearStoredMessages, getDefaultMessage, loadMessages, saveMessages } from '../Chat.storage';
import type { Message } from '../chat.types';

function buildMessage(id: string): Message {
  return {
    id,
    role: id === '0' ? 'assistant' : 'user',
    content: `message-${id}`,
    timestamp: Number(id),
  };
}

describe('Chat.storage', () => {
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};

    return {
      clear: vi.fn(() => {
        store = {};
      }),
      getItem: vi.fn((key: string) => store[key] ?? null),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      configurable: true,
      writable: true,
    });

    mockLocalStorage.clear();
  });

  it('creates the default assistant greeting', () => {
    const message = getDefaultMessage();

    expect(message.id).toBe('1');
    expect(message.role).toBe('assistant');
    expect(message.content).toContain('AI assistant');
  });

  it('returns only valid stored messages', () => {
    localStorage.setItem(
      STORAGE_KEYS.CHAT_HISTORY,
      JSON.stringify([
        buildMessage('0'),
        { nope: true },
        { id: '2', role: 'user', content: 'missing timestamp' },
        { id: '3', role: 'system', content: 'wrong role', timestamp: 3 },
        { id: '4', role: 'assistant', content: 42, timestamp: 4 },
        { id: '5', role: 'assistant', content: 'bad feedback', timestamp: 5, feedback: 'maybe' },
      ])
    );

    expect(loadMessages()).toEqual([buildMessage('0')]);
  });

  it('truncates saved history to the configured limit', () => {
    const messages = Array.from(
      { length: DEFAULTS.MAX_CHAT_MESSAGES + 3 },
      (_, index) => buildMessage(String(index))
    );

    saveMessages(messages);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY) ?? '[]') as Message[];
    expect(stored).toHaveLength(DEFAULTS.MAX_CHAT_MESSAGES);
    expect(stored[0]?.id).toBe('3');
    expect(stored.at(-1)?.id).toBe(String(DEFAULTS.MAX_CHAT_MESSAGES + 2));
  });

  it('clears persisted history', () => {
    saveMessages([buildMessage('1')]);

    clearStoredMessages();

    expect(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)).toBeNull();
  });
});
