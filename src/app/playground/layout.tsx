import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playground | Kevin Jiang',
  description: 'Interactive game lab with reaction, typing, rhythm, sorting, and arcade experiments.',
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
