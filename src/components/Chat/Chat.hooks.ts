'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
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
import type { ChatFunctions, Message } from './Chat.types';

interface UseChatSessionOptions {
  onReady?: (fns: ChatFunctions | null) => void;
}

export function useChatSession({ onReady }: UseChatSessionOptions) {
  const [messages, setMessages] = useState<Message[]>([getDefaultMessage()]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const stored = loadMessages();
    if (stored) {
      messagesRef.current = stored;
      setMessages(stored);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveMessages(messages);
    }
  }, [isHydrated, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFeedback = useCallback(
    async (messageId: string, feedback: 'positive' | 'negative') => {
      const targetMessage = messagesRef.current.find((message) => message.id === messageId);
      if (!targetMessage) {
        return;
      }

      const nextFeedback = targetMessage.feedback === feedback ? null : feedback;

      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === messageId
            ? { ...message, feedback: nextFeedback }
            : message
        )
      );

      if (!nextFeedback) {
        return;
      }

      try {
        await fetch(API_ENDPOINTS.FEEDBACK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            feedback: nextFeedback,
            messageContent: targetMessage.content,
            timestamp: Date.now(),
          }),
        });
      } catch {
        // Feedback is non-critical; keep local state only.
      }
    },
    []
  );

  const addAssistantMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    setMessages((previousMessages) => {
      const nextMessages = [
        ...previousMessages,
        {
          id: generateId(),
          role: 'assistant' as const,
          content: trimmed,
          timestamp: Date.now(),
        },
      ];

      messagesRef.current = nextMessages;
      return nextMessages;
    });
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    clearStoredMessages();

    const resetMessages = [getClearedMessage()];

    messagesRef.current = resetMessages;
    setMessages(resetMessages);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) {
        return;
      }

      analytics.chatMessageSent();

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const nextMessages = [...messagesRef.current, userMessage];
      messagesRef.current = nextMessages;
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

        setMessages((previousMessages) => {
          const updatedMessages = [...previousMessages, assistantMessage];
          messagesRef.current = updatedMessages;
          return updatedMessages;
        });
      } catch (requestError) {
        const nextError =
          requestError instanceof Error && requestError.name === 'AbortError'
            ? 'Request timed out. Please try again.'
            : 'Failed to send message. Please try again.';

        setError(nextError);

        const fallbackMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `I apologize, but I'm having trouble connecting right now. You can reach ${PORTFOLIO_DATA.personal.name} directly at ${PORTFOLIO_DATA.personal.email}.`,
          timestamp: Date.now(),
        };

        setMessages((previousMessages) => {
          const updatedMessages = [...previousMessages, fallbackMessage];
          messagesRef.current = updatedMessages;
          return updatedMessages;
        });
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading]
  );

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const clearChatRef = useRef(clearChat);
  clearChatRef.current = clearChat;

  useEffect(() => {
    if (!onReady) {
      return;
    }

    const chatFunctions: ChatFunctions = {
      send: (content: string) => {
        void sendMessageRef.current(content);
      },
      addAssistant: addAssistantMessage,
      clear: () => clearChatRef.current(),
    };

    onReady(chatFunctions);
    return () => onReady(null);
  }, [addAssistantMessage, onReady]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      void sendMessage(question);
    },
    [sendMessage]
  );

  return {
    messages,
    input,
    isLoading,
    error,
    isDemoMode,
    inputRef,
    messagesEndRef,
    setInput,
    handleSubmit,
    handleSuggestedQuestion,
    handleFeedback,
  };
}
