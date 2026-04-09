import { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `Playground | ${siteConfig.name}`,
  description: `${siteConfig.name}'s interactive games and tests, including reaction time, typing speed, and rhythm challenges.`,
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
