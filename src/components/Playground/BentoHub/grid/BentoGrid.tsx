'use client';

import { useRef, useState, useEffect, useLayoutEffect, useCallback, createContext, useContext } from 'react';
import { useAnimationFrame } from 'framer-motion';
import { BentoCard } from './BentoCard';
import type { CardPosition } from '../BentoHub.types';
import {
  GRID_TEMPLATE_DESKTOP,
  GRID_TEMPLATE_MOBILE,
  CELL_SIZE,
  GRID_GAP,
  VISIBLE_BENTO_CARDS,
  BENTO_CARDS,
  getGridRowCount,
} from '../BentoHub.config';
import { usePhysicsEngine, type PhysicsEngine, type Vector2 } from '../physics';
import type { StoredScores } from '../../Playground.types';
import { loadStoredScores } from '../../playground-storage';

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
  const [scores] = useState<Partial<StoredScores>>(loadStoredScores);
  const forceUpdatesRef = useRef<Map<string, (force: Vector2) => void>>(new Map());

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
  const registerForceUpdater = useCallback((cardId: string, updater: (force: Vector2) => void) => {
    forceUpdatesRef.current.set(cardId, updater);
    return () => {
      forceUpdatesRef.current.delete(cardId);
    };
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
  const rows = getGridRowCount(gridTemplate);

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
        const msScores = scores.minesweeper;
        if (!msScores) return undefined;
        const bestTime = Math.min(...Object.values(msScores).map((s) => s.bestTime).filter(t => t < Infinity));
        return bestTime < Infinity ? `${bestTime}s` : undefined;
      case 'game2048':
        const g2048Scores = scores.game2048;
        return g2048Scores?.bestScore ? g2048Scores.bestScore.toLocaleString() : undefined;
      case 'pacman':
        const pacmanScores = scores.pacman;
        return pacmanScores?.highScore ? pacmanScores.highScore.toLocaleString() : undefined;
      case 'aim':
        const aimScores = scores.aimTrainer;
        if (!aimScores) return undefined;
        const bestAimScore = Math.max(...Object.values(aimScores).map((s) => s.bestScore).filter(s => s > 0));
        return bestAimScore > 0 ? bestAimScore.toLocaleString() : undefined;
      default:
        return undefined;
    }
  };

  return (
    <PhysicsContext.Provider value={{ engine, centerPoint }}>
      <div ref={containerRef} className="relative flex w-full justify-center py-4 md:py-6">
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
            minHeight: rows * cellSize + Math.max(rows - 1, 0) * gap,
          }}
        >
          <div className="pointer-events-none absolute -inset-4 rounded-[2rem] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] shadow-[0_24px_90px_rgba(0,0,0,0.22)]" />
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-30"
            style={{
              background:
                'radial-gradient(circle at 20% 0%, rgba(251,191,36,0.12), transparent 34%), radial-gradient(circle at 78% 100%, rgba(167,139,250,0.12), transparent 38%)',
            }}
          />

          {isReady &&
            VISIBLE_BENTO_CARDS.map((card) => {
              const position = positions.get(card.id);
              if (!position) return null;

              return (
                <div
                  key={`${card.id}-slot`}
                  className="pointer-events-none absolute rounded-2xl border border-[rgba(255,255,255,0.045)] bg-[rgba(255,255,255,0.018)]"
                  style={{
                    left: position.x,
                    top: position.y,
                    width: position.width,
                    height: position.height,
                  }}
                />
              );
            })}

          {isReady &&
            VISIBLE_BENTO_CARDS.map((card, index) => {
              const position = positions.get(card.id);
              if (!position) return null;

              return (
                <BentoCard
                  key={card.id}
                  config={card}
                  homePosition={position}
                  bestScore={getBestScore(card.id)}
                  index={index}
                  registerForceUpdater={registerForceUpdater}
                />
              );
            })}
        </div>
      </div>
    </PhysicsContext.Provider>
  );
}
