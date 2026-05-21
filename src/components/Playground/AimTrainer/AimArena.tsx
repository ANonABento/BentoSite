'use client';

import { m } from 'framer-motion';
import { Target } from './AimTrainer.types';
import { ARENA } from './AimTrainer.config';

interface AimArenaProps {
  targets: Target[];
  sensitivity: number;
  onHit: (targetId: string) => void;
  onMiss: () => void;
}

function projectTarget(target: Target) {
  const [x, y, z] = target.position;
  const depthRatio = Math.min(1, Math.max(0, Math.abs(z) / ARENA.depth));
  const xRange = ARENA.width / 1.65;
  const yRange = ARENA.height / 1.35;
  const left = 50 + (x / xRange) * 50;
  const top = 50 - (y / yRange) * 50;
  const scale = 1.2 - depthRatio * 0.35;
  const size = Math.max(34, Math.min(76, target.size * 84 * scale));

  return {
    left: `${Math.min(92, Math.max(8, left))}%`,
    top: `${Math.min(88, Math.max(12, top))}%`,
    size,
    depthRatio,
  };
}

export function AimArena({ targets, sensitivity, onHit, onMiss }: AimArenaProps) {
  return (
    <button
      type="button"
      className="absolute inset-0 block cursor-crosshair overflow-hidden bg-[var(--pg-bg-deep)] text-left"
      onClick={onMiss}
      aria-label="Aim trainer arena"
      style={{ touchAction: 'manipulation' }}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--pg-game-error) 16%, transparent), transparent 42%), linear-gradient(180deg, var(--pg-bg-surface), var(--pg-bg-deep))',
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(var(--pg-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--pg-border-subtle) 1px, transparent 1px)',
          backgroundSize: `${Math.max(22, 44 / sensitivity)}px ${Math.max(22, 44 / sensitivity)}px`,
        }}
      />
      <div className="absolute inset-x-[10%] top-[16%] h-px bg-[var(--pg-border-subtle)]" />
      <div className="absolute inset-x-[14%] bottom-[18%] h-px bg-[var(--pg-border-subtle)]" />
      <div className="absolute left-[12%] right-[12%] top-[16%] bottom-[18%] rounded-[28px] border border-[var(--pg-border-subtle)]" />

      {targets.map((target) => {
        if (!target.active) return null;

        const projected = projectTarget(target);

        return (
          <m.span
            key={target.id}
            className="absolute z-10 block -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--pg-text-on-accent)] shadow-[0_0_30px_color-mix(in_srgb,var(--pg-game-error)_55%,transparent)]"
            style={{
              left: projected.left,
              top: projected.top,
              width: projected.size,
              height: projected.size,
              background:
                'radial-gradient(circle, var(--pg-text-on-accent) 0 13%, var(--pg-game-error) 14% 45%, color-mix(in srgb, var(--pg-game-error) 35%, black) 46% 100%)',
              opacity: 1 - projected.depthRatio * 0.18,
            }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [1, 1.06, 1], opacity: 1 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            onClick={(event) => {
              event.stopPropagation();
              onHit(target.id);
            }}
          />
        );
      })}
    </button>
  );
}
