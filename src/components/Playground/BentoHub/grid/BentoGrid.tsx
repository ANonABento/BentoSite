'use client';

import { useRef, useState, useEffect, useLayoutEffect, useCallback, createContext, useContext } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { CardPosition } from '../BentoHub.types';
import {
  BENTO_CARDS,
  GRID_TEMPLATE_DESKTOP,
  GRID_TEMPLATE_MOBILE,
  CELL_SIZE,
  GRID_GAP,
} from '../BentoHub.config';
import { usePhysicsEngine, PhysicsEngine } from '../physics';
import { STORAGE_KEYS } from '../../Playground.config';
import { StoredScores } from '../../Playground.types';

// Physics context for cards to access the engine
interface PhysicsContextValue {
  engine: PhysicsEngine | null;
  centerPoint: { x: number; y: number };
}

const PhysicsContext = createContext<PhysicsContextValue>({
  engine: null,
  centerPoint: { x: 0, y: 0 },
});

export const usePhysicsContext = () => useContext(PhysicsContext);

interface BentoGridProps {
  isMobile: boolean;
}

export function BentoGrid({ isMobile }: BentoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Map<string, CardPosition>>(new Map());
  const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [scores, setScores] = useState<Partial<StoredScores>>({});

  // Force updates for physics
  const [, forceUpdate] = useState(0);
  const forceUpdatesRef = useRef<Map<string, (force: { x: number; y: number }) => void>>(new Map());

  // Physics engine
  const engine = usePhysicsEngine({
    centerPoint,
    onUpdate: (cardId, force) => {
      const updater = forceUpdatesRef.current.get(cardId);
      if (updater) {
        updater(force);
      }
    },
  });

  // Register force updater for a card
  const registerForceUpdater = useCallback((cardId: string, updater: (force: { x: number; y: number }) => void) => {
    forceUpdatesRef.current.set(cardId, updater);
    return () => {
      forceUpdatesRef.current.delete(cardId);
    };
  }, []);

  // Load scores
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.highScores);
      if (stored) {
        setScores(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Calculate card positions from grid layout
  const calculatePositions = useCallback(() => {
    if (!gridRef.current || !containerRef.current) return;

    const newPositions = new Map<string, CardPosition>();

    BENTO_CARDS.forEach((card) => {
      const element = gridRef.current?.querySelector(`[data-card-id="${card.id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const gridRect = gridRef.current!.getBoundingClientRect();

        newPositions.set(card.id, {
          x: rect.left - gridRect.left,
          y: rect.top - gridRect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    // Calculate center point (center of the grid)
    const gridRect = gridRef.current!.getBoundingClientRect();
    setCenterPoint({
      x: gridRect.width / 2,
      y: gridRect.height / 2,
    });

    setPositions(newPositions);
    setIsReady(true);
  }, []);

  // Use layout effect for synchronous measurement after render
  useLayoutEffect(() => {
    calculatePositions();
  }, [calculatePositions, isMobile]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePositions]);

  // Run physics simulation
  useAnimationFrame(() => {
    engine.step();
  });

  const cellSize = isMobile ? CELL_SIZE.mobile : CELL_SIZE.desktop;
  const gap = isMobile ? GRID_GAP.mobile : GRID_GAP.desktop;
  const gridTemplate = isMobile ? GRID_TEMPLATE_MOBILE : GRID_TEMPLATE_DESKTOP;
  const columns = isMobile ? 2 : 3;

  const getBestScore = (gameId: string): string | undefined => {
    switch (gameId) {
      case 'reaction':
        return scores.reaction?.best ? `${scores.reaction.best}ms` : undefined;
      case 'typing':
        return scores.typing?.bestWPM ? `${scores.typing.bestWPM} WPM` : undefined;
      case 'rhythm':
        const rhythmScores = scores.rhythm;
        if (!rhythmScores) return undefined;
        const best = Math.max(...Object.values(rhythmScores).map((s) => s.score));
        return best > 0 ? `${best.toLocaleString()}` : undefined;
      case 'minesweeper':
        const msScores = scores.minesweeper as Record<string, { bestTime: number }> | undefined;
        if (!msScores) return undefined;
        const bestTime = Math.min(...Object.values(msScores).map((s) => s.bestTime).filter(t => t < Infinity));
        return bestTime < Infinity ? `${bestTime}s` : undefined;
      case 'game2048':
        const g2048Scores = scores.game2048 as { bestScore: number } | undefined;
        return g2048Scores?.bestScore ? g2048Scores.bestScore.toLocaleString() : undefined;
      case 'pacman':
        const pacmanScores = scores.pacman as { highScore: number } | undefined;
        return pacmanScores?.highScore ? pacmanScores.highScore.toLocaleString() : undefined;
      case 'aim':
        const aimScores = scores.aimTrainer as Record<string, { bestScore: number }> | undefined;
        if (!aimScores) return undefined;
        const bestAimScore = Math.max(...Object.values(aimScores).map((s) => s.bestScore).filter(s => s > 0));
        return bestAimScore > 0 ? bestAimScore.toLocaleString() : undefined;
      default:
        return undefined;
    }
  };

  return (
    <PhysicsContext.Provider value={{ engine, centerPoint }}>
      <div ref={containerRef} className="relative w-full flex justify-center">
        {/* Hidden grid for position calculation */}
        <div
          ref={gridRef}
          className="grid opacity-0 pointer-events-none absolute"
          style={{
            gridTemplateAreas: gridTemplate,
            gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
            gridAutoRows: `${cellSize}px`,
            gap: `${gap}px`,
          }}
        >
          {BENTO_CARDS.map((card) => (
            <div
              key={card.id}
              data-card-id={card.id}
              style={{ gridArea: card.gridArea }}
            />
          ))}
        </div>

        {/* Visible draggable cards */}
        <div
          className="relative"
          style={{
            width: columns * cellSize + (columns - 1) * gap,
            height: 'auto',
            minHeight: isMobile ? 5 * cellSize + 4 * gap : 3 * cellSize + 2 * gap,
          }}
        >
          {isReady &&
            BENTO_CARDS.filter((card) => card.contentType !== 'void').map((card) => {
              const position = positions.get(card.id);
              if (!position) return null;

              return (
                <BentoCard
                  key={card.id}
                  config={card}
                  homePosition={position}
                  bestScore={getBestScore(card.id)}
                  registerForceUpdater={registerForceUpdater}
                />
              );
            })}

        </div>
      </div>
    </PhysicsContext.Provider>
  );
}


// Backwards compat
export { BentoGrid as FidgetGrid };
