import { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `Playground | ${siteConfig.name}`,
  description: `Interactive game lab from ${siteConfig.name} with reaction, typing, rhythm, sorting, and arcade experiments.`,
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
