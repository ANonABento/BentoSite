import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
