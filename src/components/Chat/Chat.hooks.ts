'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { analytics } from '@/lib/analytics';
import { API_ENDPOINTS, TIMEOUTS } from '@/lib/constants';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { generateId } from '@/lib/utils';
import {
  clearStoredMessages,
  getClearedMessage,
  getDefaultMessage,
  loadMessages,
  saveMessages,
} from './Chat.storage';
import type { Message } from './Chat.types';

interface UseChatSubmitOptions {
  inputRef: React.RefObject<HTMLInputElement | null>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>(() => loadMessages() ?? [getDefaultMessage()]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveMessages(messages);
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

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: generateId(),
        role: 'assistant',
        content: trimmedContent,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const clearChat = useCallback(() => {
    clearStoredMessages();
    setMessages([getClearedMessage()]);
  }, []);

  return {
    messages,
    setMessages,
    messagesEndRef,
    addAssistantMessage,
    clearChat,
  };
}

export function useChatSubmit({ inputRef, messages, setMessages }: UseChatSubmitOptions) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleFeedback = useCallback(
    async (messageId: string, feedback: 'positive' | 'negative') => {
      const message = messages.find((candidate) => candidate.id === messageId);
      if (!message) {
        return;
      }

      const newFeedback = message.feedback === feedback ? null : feedback;

      setMessages((previousMessages) =>
        previousMessages.map((candidate) =>
          candidate.id === messageId
            ? { ...candidate, feedback: newFeedback }
            : candidate
        )
      );

      if (!newFeedback) {
        return;
      }

      try {
        await fetch(API_ENDPOINTS.FEEDBACK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            feedback: newFeedback,
            messageContent: message.content,
            timestamp: Date.now(),
          }),
        });
      } catch {
        // Feedback is best-effort only.
      }
    },
    [messages, setMessages]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) {
        return;
      }

      analytics.chatMessageSent();

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      const nextMessages = [...messagesRef.current, userMessage];

      setMessages(nextMessages);
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CHAT_REQUEST);

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

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.isDemoMode !== undefined) {
          setIsDemoMode(data.isDemoMode);
        }

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.message || 'Sorry, I could not process your request.',
          timestamp: Date.now(),
        };

        setMessages((previousMessages) => [...previousMessages, assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error && err.name === 'AbortError'
            ? 'Request timed out. Please try again.'
            : 'Failed to send message. Please try again.';

        setError(errorMessage);
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            id: generateId(),
            role: 'assistant',
            content: `I apologize, but I'm having trouble connecting right now. You can reach ${PORTFOLIO_DATA.personal.name} directly at ${PORTFOLIO_DATA.personal.email}.`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [inputRef, isLoading, setMessages]
  );

  return {
    input,
    setInput,
    isLoading,
    error,
    isDemoMode,
    sendMessage,
    handleFeedback,
    clearError,
  };
}
