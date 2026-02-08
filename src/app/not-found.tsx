import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] bg-grid flex items-center justify-center p-4">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--purple-muted)] opacity-50 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--purple-muted)] opacity-50 rounded-full blur-[100px]" />
      </div>

      {/* Content card */}
      <div className="relative glass rounded-2xl p-8 md:p-12 max-w-lg w-full text-center glow-subtle">
        {/* 404 number */}
        <h1 className="text-8xl md:text-9xl font-bold text-gradient mb-4">
          404
        </h1>

        {/* Message */}
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mb-2">
          Page Not Found
        </h2>
        <p className="text-[var(--text-secondary)] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Back to home button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium
            text-[var(--text-on-accent)] hover:shadow-[0_0_20px_var(--purple-muted)] hover:scale-105
            transition-all duration-300"
          style={{ background: 'linear-gradient(to right, var(--purple), var(--purple-active))' }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Back to Home
        </Link>

        {/* Decorative dots */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--purple-muted)] opacity-80 animate-pulse" />
          <div
            className="w-2 h-2 rounded-full bg-[var(--purple-muted)] opacity-80 animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[var(--status-info-muted)] opacity-80 animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    </div>
  );
}
