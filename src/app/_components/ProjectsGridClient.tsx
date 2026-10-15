'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Viewfinder } from '@/components/Viewfinder/Viewfinder';
import { TrayFill } from './TrayFill';
import type { ViewfinderProject } from '@/components/Viewfinder/types';
import { InfoCard, IntroCard, ProjectCard, type InfoContent, type IntroProfile } from '@/components/BentoGrid/cards';
import {
  BentoGrid,
  type BoardLayout,
  type CardData,
  type CardPosition,
  type InfoCardData,
  type IntroCardData,
  type ProjectCardData,
  type Rect,
  type ThemeConfig,
} from '@/components/BentoGrid';

export const INTRO: IntroCardData = { id: 'intro', type: 'intro', title: 'Kevin Jiang' };
export const CONTACT: InfoCardData = { id: 'contact', type: 'info', variant: 'contact', title: 'Contact', pinned: true };

export interface ProjectsGridProps {
  layout: BoardLayout;
  projects: ProjectCardData[];
  profile: IntroProfile;
  info: InfoContent;
  /** Each project's viewfinder data, by id. */
  details: Record<string, ViewfinderProject>;
}

export function makeRenderCard(profile: IntroProfile, info: InfoContent) {
  return function renderProjectCard(
    card: CardData,
    position: CardPosition,
    theme: ThemeConfig,
    isFocused?: boolean,
    onClick?: () => void,
    entranceIndex = 0,
  ): ReactNode {
    if (card.type === 'intro') {
      return <IntroCard card={card} position={position} theme={theme} profile={profile} isFocused={isFocused} />;
    }
    if (card.type === 'info') {
      return (
        <InfoCard
          card={card}
          position={position}
          theme={theme}
          content={info}
          isFocused={isFocused}
          onClick={onClick}
          entranceIndex={entranceIndex}
        />
      );
    }
    if (card.type !== 'project') {
      return null;
    }

    return (
      <ProjectCard
        card={card}
        position={position}
        theme={theme}
        isFocused={isFocused}
        onClick={onClick}
        entranceIndex={entranceIndex}
      />
    );
  };
}

/** The project named in the URL (`/?project=<id>`), if it's one we know. */
function projectInUrl(details: Record<string, ViewfinderProject>): string | null {
  const id = new URLSearchParams(window.location.search).get('project');
  return id && details[id] ? id : null;
}

export function ProjectsGridClient({ layout, projects, profile, info, details }: ProjectsGridProps) {
  // Every card goes on the board once; the board repeats it in every direction.
  const cards = useMemo<CardData[]>(() => [INTRO, CONTACT, ...projects], [projects]);
  const renderCard = useMemo(() => makeRenderCard(profile, info), [profile, info]);

  // Clicking a project opens it in the viewfinder over the board. The URL
  // follows (`/?project=<id>`), so the link can be shared and Back closes it.
  const [open, setOpen] = useState<{ id: string; origin: Rect | null } | null>(() => {
    const id = projectInUrl(details);
    return id ? { id, origin: null } : null;
  });
  const pushed = useRef(false);

  useEffect(() => {
    const sync = () => {
      const id = projectInUrl(details);
      if (!id) pushed.current = false;
      setOpen((current) => (id ? (current?.id === id ? current : { id, origin: null }) : null));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [details]);

  const handleCardSelect = useCallback(
    (card: CardData, origin?: Rect) => {
      if (card.type !== 'project' || !details[card.id]) return;
      const url = new URL(window.location.href);
      url.searchParams.set('project', card.id);
      window.history.pushState(null, '', url);
      pushed.current = true;
      setOpen({ id: card.id, origin: origin ?? null });
    },
    [details],
  );

  const close = useCallback(() => {
    if (pushed.current) {
      // Popping our own entry keeps history clean; popstate clears `open`.
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    window.history.replaceState(null, '', url);
    setOpen(null);
  }, []);

  return (
    <>
      <BentoGrid
        theme="premium"
        cards={cards}
        layout={layout}
        cardSizeMode="detail"
        onCardSelect={handleCardSelect}
        breadcrumb="bentOS / Kevin Jiang"
        renderCard={renderCard}
        spotlight
      />
      <TrayFill />
      <AnimatePresence>
        {open && <Viewfinder key={open.id} project={details[open.id]} origin={open.origin} onClose={close} />}
      </AnimatePresence>
    </>
  );
}
