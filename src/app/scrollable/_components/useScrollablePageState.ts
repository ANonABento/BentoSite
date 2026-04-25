'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatFunctions } from '@/components/Chat';

type ChatPanelFunctions = Pick<ChatFunctions, 'send' | 'clear'>;

export function useScrollablePageState() {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatFns, setChatFns] = useState<ChatPanelFunctions | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const pendingChatMessageRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleAskAboutSkill = useCallback(
    (skill: string) => {
      const message = `Tell me about your experience with ${skill}`;
      setIsChatOpen(true);
      if (chatFns) {
        chatFns.send(message);
        return;
      }

      pendingChatMessageRef.current = message;
    },
    [chatFns]
  );

  const handleChatReady = useCallback((fns: ChatPanelFunctions | null) => {
    setChatFns(fns);

    if (!fns || !pendingChatMessageRef.current || !isMountedRef.current) {
      return;
    }

    fns.send(pendingChatMessageRef.current);
    pendingChatMessageRef.current = null;
  }, []);

  return {
    chatFns,
    chatRef,
    handleChatReady,
    handleAskAboutSkill,
    isChatOpen,
    isProjectsOpen,
    scrollToSection,
    scrollToTop,
    setIsChatOpen,
    setIsProjectsOpen,
    showScrollTop,
  };
}
