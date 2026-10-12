import type { Metadata } from 'next';
import { Instrument_Sans, Orbitron, VT323 } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SITE_URL, profile } from '@/lib/content';
import './globals.css';

const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });
const orbitron = Orbitron({ subsets: ['latin'], weight: '700', variable: '--font-orbitron' });
const vt323 = VT323({ subsets: ['latin'], weight: '400', variable: '--font-vt323' });

const description =
  'Kevin Jiang is a computer engineering student at the University of Waterloo building robots and the software that runs them.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${profile.name} — bentOS`, template: `%s — ${profile.name}` },
  description,
  openGraph: { type: 'website', siteName: 'bentOS', title: profile.name, description },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${orbitron.variable} ${vt323.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
