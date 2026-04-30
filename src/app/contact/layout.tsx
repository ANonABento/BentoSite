import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `Contact | ${siteConfig.name}`,
  description: `Send a message to ${siteConfig.name}.`,
};

export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
