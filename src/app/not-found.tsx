import Link from 'next/link';
import SiteLayout from './(site)/layout';

export default function NotFound() {
  return (
    <SiteLayout>
      <div className="tray">
        <div className="cell crt grid min-h-[50vh] place-content-center gap-3 p-10 text-center text-2xl">
          <p>
            <span className="text-orange">&gt;</span> cd {'<that page>'}
          </p>
          <p className="text-phosphor/70">no such file or directory</p>
          <Link href="/" className="mt-4 text-orange underline underline-offset-4">
            Go to the home page
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
