'use client';

/**
 * InfoCard — the non-project compartment under the search card: resume and contact links.
 */

import type { CardPosition, InfoCardData, ThemeConfig } from '../BentoGrid.types';
import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon, DocumentDownloadIcon, GitHubIcon, LinkedInIcon } from '@/components/ui/Icons';
import { BaseCard } from './BaseCard';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

export interface InfoContent {
  links: { resume: string; github: string; linkedin: string; email: string };
}

export interface InfoCardProps {
  card: InfoCardData;
  position: CardPosition;
  theme: ThemeConfig;
  content: InfoContent;
  isFocused?: boolean;
  onClick?: () => void;
  entranceIndex?: number;
}

export function InfoCard({ card, position, theme, content, isFocused, entranceIndex }: InfoCardProps) {
  const { links } = content;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyEmail = () => {
    navigator.clipboard?.writeText(links.email).then(() => setCopied(true), () => {});
  };

  const button = 'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

  return (
    <BaseCard id={card.id} position={position} theme={theme} isFocused={isFocused} entranceIndex={entranceIndex} hoverEnabled={false} ariaLabel="Contact">
      <div className="flex h-full flex-col justify-between gap-4 p-5">
        <div>
          <h2 className="text-sm text-ash">Get in touch</h2>
          <div className="mt-2 flex items-center gap-2">
            <a
              href={`mailto:${links.email}`}
              className={`min-w-0 truncate font-crt leading-none text-rice transition-colors hover:text-orange ${
                // The whole address fits on a phone-width card too.
                position.width < 420 ? 'text-[1.35rem]' : 'text-[1.75rem]'
              }`}
            >
              <span className="text-orange">&gt;</span> {links.email}
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-ash transition-colors hover:bg-white/5 hover:text-rice"
              aria-label={copied ? 'Email copied' : 'Copy email address'}
            >
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a href={links.resume} {...ext} className={`${button} bg-orange text-lacquer hover:brightness-110`}>
            <DocumentDownloadIcon size={15} />
            Resume
          </a>
          <a href={links.github} {...ext} className={`${button} bg-white/5 text-rice hover:bg-white/10`}>
            <GitHubIcon size={15} />
            GitHub
          </a>
          <a href={links.linkedin} {...ext} className={`${button} bg-white/5 text-rice hover:bg-white/10`}>
            <LinkedInIcon size={15} />
            LinkedIn
          </a>
        </div>
      </div>
    </BaseCard>
  );
}
