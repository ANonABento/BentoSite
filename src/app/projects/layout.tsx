import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects | bentOS',
  description: 'Portfolio projects showcase - Robotics, AI, Software, and more.',
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
