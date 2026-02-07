import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playground | Ben Thomas',
  description: 'Interactive games and tests - reaction time, typing speed, rhythm game',
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
