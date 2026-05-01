import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photography | bentOS',
  description: 'A responsive photography portfolio gallery with optimized images.',
};

export default function PhotographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
