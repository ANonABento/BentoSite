'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatFunctions } from '@/components/Chat/chat.types';

type ChatPanelFunctions = Pick<ChatFunctions, 'send' | 'clear'>;

export function useScrollablePageState() {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatFns, setChatFns] = useState<ChatPanelFunctions | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

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
      setIsChatOpen(true);
      window.setTimeout(() => {
        if (isMountedRef.current) {
          chatFns?.send(`Tell me about your experience with ${skill}`);
        }
      }, 300);
    },
    [chatFns]
  );

  return {
    chatFns,
    chatRef,
    handleAskAboutSkill,
    isChatOpen,
    isProjectsOpen,
    scrollToSection,
    scrollToTop,
    setChatFns,
    setIsChatOpen,
    setIsProjectsOpen,
    showScrollTop,
  };
}
