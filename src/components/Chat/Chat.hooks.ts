'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { analytics } from '@/lib/analytics';
import { API_ENDPOINTS, TIMEOUTS } from '@/lib/constants';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { generateId } from '@/lib/utils';
import {
  clearStoredMessages,
  createDefaultMessage,
  loadStoredMessages,
  saveStoredMessages,
} from './chat-storage';
import type { Message } from './chat.types';

interface UseChatSubmitOptions {
  inputRef: RefObject<HTMLInputElement | null>;
  messagesRef: MutableRefObject<Message[]>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

interface ChatApiResponse {
  error?: string;
  isDemoMode?: boolean;
  message?: string;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseChatApiResponse(value: unknown): ChatApiResponse {
  if (!isObjectRecord(value)) {
    return {};
  }

  return {
    error: typeof value.error === 'string' ? value.error : undefined,
    isDemoMode: typeof value.isDemoMode === 'boolean' ? value.isDemoMode : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
  };
}

async function readChatApiResponse(response: Response): Promise<ChatApiResponse> {
  const data: unknown = await response.json().catch(() => null);
  return parseChatApiResponse(data);
}

export function useChatMessages(projectName?: string) {
  const [messages, setMessages] = useState<Message[]>(
    () => loadStoredMessages() ?? [createDefaultMessage()]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addAssistantMessage = useCallback((content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    setMessages((previousMessages) => {
      const updatedMessages = [
        ...previousMessages,
        {
          id: generateId(),
          role: 'assistant' as const,
          content: trimmedContent,
          timestamp: Date.now(),
        },
      ];

      messagesRef.current = updatedMessages;
      return updatedMessages;
    });
  }, []);

  const clearChat = useCallback(() => {
    clearStoredMessages();
    // In project mode the visitor is still on a `?project=` URL, so the
    // generic greeting threw away the context they were reading about.
    const greeting = projectName
      ? `Chat cleared! Ask me anything about ${projectName} — or about anything else ${PORTFOLIO_DATA.personal.name} has built.`
      : `Chat cleared! I'm ${PORTFOLIO_DATA.personal.name}'s AI assistant. What would you like to know?`;
    const resetMessages = [
      {
        ...createDefaultMessage(),
        id: generateId(),
        content: greeting,
      },
    ];
    messagesRef.current = resetMessages;
    setMessages(resetMessages);
  }, [projectName]);

  return {
    messages,
    messagesRef,
    setMessages,
    messagesEndRef,
    addAssistantMessage,
    clearChat,
  };
}

export function useChatSubmit({ inputRef, messagesRef, setMessages }: UseChatSubmitOptions) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isLoading) {
        return;
      }

      analytics.chatMessageSent();

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: trimmedContent,
        timestamp: Date.now(),
      };

      const nextMessages = [...messagesRef.current, userMessage];

      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      setInput('');
      setIsLoading(true);
      setError(null);

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CHAT_REQUEST);

        const response = await fetch(API_ENDPOINTS.CHAT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
          signal: controller.signal,
        });

        const data = await readChatApiResponse(response);

        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }

        if (data.isDemoMode !== undefined) {
          setIsDemoMode(data.isDemoMode);
        }

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.message || 'Sorry, I could not process your request.',
          timestamp: Date.now(),
        };

        setMessages((previousMessages) => {
          const updatedMessages = [...previousMessages, assistantMessage];
          messagesRef.current = updatedMessages;
          return updatedMessages;
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error && err.name === 'AbortError'
            ? 'Request timed out. Please try again.'
            : 'Failed to send message. Please try again.';

        setError(errorMessage);
        setMessages((previousMessages) => {
          const fallbackMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: `I apologize, but I'm having trouble connecting right now. You can reach ${PORTFOLIO_DATA.personal.name} directly at ${PORTFOLIO_DATA.personal.email}.`,
            timestamp: Date.now(),
          };
          const updatedMessages = [...previousMessages, fallbackMessage];
          messagesRef.current = updatedMessages;
          return updatedMessages;
        });
      } finally {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [inputRef, isLoading, messagesRef, setMessages]
  );

  return {
    input,
    setInput,
    isLoading,
    error,
    isDemoMode,
    sendMessage,
    clearError,
  };
}
