import type { MapLocation } from '../Viewfinder.types';

interface MapMarkerTooltipProps {
  location: MapLocation;
  onClose: () => void;
}

export function MapMarkerTooltip({ location, onClose }: MapMarkerTooltipProps) {
  return (
    <div className="absolute z-10 pointer-events-auto" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -120%)' }}>
      <div
        className="rounded-lg border border-[var(--border)] bg-[var(--glass-bg-strong)] backdrop-blur-md px-4 py-3 shadow-lg min-w-[200px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{location.label}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{location.sublabel}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{location.location}</p>
            <p className="text-xs text-[var(--text-muted)]">{location.period}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            aria-label="Close tooltip"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${location.type === 'education' ? 'bg-[var(--primary)]' : 'bg-[var(--orange)]'}`} />
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {location.type === 'education' ? 'Education' : 'Work'}
          </span>
        </div>
      </div>
    </div>
  );
}
