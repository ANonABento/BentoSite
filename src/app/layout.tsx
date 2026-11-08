import type { Metadata } from 'next';
import { Instrument_Sans, Orbitron, VT323 } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SITE_URL, profile } from '@/lib/content';
import './globals.css';

const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });
const orbitron = Orbitron({ subsets: ['latin'], weight: '700', variable: '--font-orbitron' });
const vt323 = VT323({ subsets: ['latin'], weight: '400', variable: '--font-vt323' });

const description =
  `${profile.name}, ${profile.title}. Forward Deployed Engineer at RLWRLD and Computer Engineering at the University of Waterloo: robot teleoperation, ROS 2, on-device AI and the hardware under it.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${profile.name} — ${profile.title}`, template: `%s — ${profile.name}` },
  description,
  openGraph: { type: 'website', siteName: profile.name, title: `${profile.name} — ${profile.title}`, description },
  twitter: { card: 'summary_large_image' },
};

const POSTER_SCRIPT = `(function(){try{var q=location.search;if(/[?&](project|noprologue)(=|&|$)/.test(q))return;var c=navigator.connection;if(c&&c.saveData)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(sessionStorage.getItem('bentOS.booted'))return;if(!matchMedia('(pointer: fine)').matches)return;if(innerWidth<900||innerHeight<560)return;var h=document.documentElement;h.classList.add('prologue-pending');setTimeout(function(){h.classList.remove('prologue-pending')},30000)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${instrument.variable} ${orbitron.variable} ${vt323.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: POSTER_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
