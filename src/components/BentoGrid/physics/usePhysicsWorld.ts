'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CardLayout,
  CardPosition,
  PhysicsPosition,
  Position,
  UsePhysicsWorldReturn,
} from '../BentoGrid.types';
import { PHYSICS, PHYSICS_MOBILE } from '../BentoGrid.constants';
import { createPhysicsEngine, syncBodiesWithLayouts, type PhysicsEngine } from './engine';
import { applySettlingForces, extractTargets, toTopLeft } from './forces';

export interface UsePhysicsWorldOptions {
  layouts: Map<string, CardPosition>;
  enabled: boolean;
  isMobile: boolean;
}

export function usePhysicsWorld({
  layouts,
  enabled,
  isMobile,
}: UsePhysicsWorldOptions): UsePhysicsWorldReturn {
  const [positions, setPositions] = useState<Map<string, PhysicsPosition>>(new Map());
  const engineRef = useRef<PhysicsEngine | null>(null);
  const targetsRef = useRef<Map<string, Position>>(new Map());
  const settlingIntervalRef = useRef<number | null>(null);
  const pendingSettlingTicksRef = useRef(0);

  const markSettlingNeeded = useCallback(() => {
    pendingSettlingTicksRef.current = 3;
  }, []);

  const hasAwakeBodies = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return false;

    for (const body of engine.bodies.values()) {
      if (!body.isStatic && !body.isSleeping) {
        return true;
      }
    }

    return false;
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    const engine = createPhysicsEngine(isMobile, (bodies, bodyLayouts) => {
      const nextPositions = new Map<string, PhysicsPosition>();

      bodies.forEach((body, id) => {
        const layout = bodyLayouts.get(id);
        if (!layout) return;

        const topLeft = toTopLeft(body, layout);
        nextPositions.set(id, {
          x: topLeft.x,
          y: topLeft.y,
          angle: body.angle,
        });
      });

      setPositions(nextPositions);
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      if (settlingIntervalRef.current) {
        clearInterval(settlingIntervalRef.current);
        settlingIntervalRef.current = null;
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, [enabled, isMobile]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !enabled) return;

    syncBodiesWithLayouts(engine, layouts, false);
    targetsRef.current = extractTargets(layouts);
    markSettlingNeeded();
  }, [enabled, layouts, markSettlingNeeded]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !enabled) return;

    if (settlingIntervalRef.current) {
      clearInterval(settlingIntervalRef.current);
      settlingIntervalRef.current = null;
    }

    let mounted = true;
    const config = isMobile ? PHYSICS_MOBILE : PHYSICS;
    settlingIntervalRef.current = window.setInterval(() => {
      if (!mounted) return;

      const hasPendingSettling = pendingSettlingTicksRef.current > 0;
      if (!hasPendingSettling && !hasAwakeBodies()) {
        return;
      }

      pendingSettlingTicksRef.current = Math.max(0, pendingSettlingTicksRef.current - 1);
      applySettlingForces(engine.bodies, targetsRef.current, config.settlingStrength);
    }, 16);

    return () => {
      mounted = false;
      if (settlingIntervalRef.current) {
        clearInterval(settlingIntervalRef.current);
        settlingIntervalRef.current = null;
      }
    };
  }, [enabled, hasAwakeBodies, isMobile]);

  const addCard = useCallback((cardId: string, position: CardPosition) => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.addBody(cardId, position, false);
    targetsRef.current.set(cardId, {
      x: position.x + position.width / 2,
      y: position.y + position.height / 2,
    });
    markSettlingNeeded();
  }, [markSettlingNeeded]);

  const removeCard = useCallback((cardId: string) => {
    engineRef.current?.removeBody(cardId);
    targetsRef.current.delete(cardId);
    markSettlingNeeded();
  }, [markSettlingNeeded]);

  const applyEntranceBurst = useCallback((cardId: string, center: Position = { x: 0, y: 0 }) => {
    engineRef.current?.applyEntranceBurst(cardId, center);
    markSettlingNeeded();
  }, [markSettlingNeeded]);

  const updateSearchCard = useCallback((layout: CardLayout, isStatic: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;

    const existing = engine.getBody(layout.id);
    if (!existing) {
      engine.addBody(layout.id, layout, isStatic);
      markSettlingNeeded();
    } else if (
      engine.layouts.get(layout.id)?.width !== layout.width ||
      engine.layouts.get(layout.id)?.height !== layout.height
    ) {
      engine.removeBody(layout.id);
      engine.addBody(layout.id, layout, isStatic);
      markSettlingNeeded();
    } else {
      engine.layouts.set(layout.id, layout);
      engine.setStatic(layout.id, isStatic);
      engine.setPosition(layout.id, layout.x + layout.width / 2, layout.y + layout.height / 2);
      markSettlingNeeded();
    }

    if (isStatic) {
      targetsRef.current.delete(layout.id);
    } else {
      targetsRef.current.set(layout.id, {
        x: layout.x + layout.width / 2,
        y: layout.y + layout.height / 2,
      });
    }

    engine.wakeAllBodies();
  }, [markSettlingNeeded]);

  const updateTargets = useCallback((newLayouts: Map<string, CardPosition>) => {
    targetsRef.current = extractTargets(newLayouts);
    markSettlingNeeded();
  }, [markSettlingNeeded]);

  return {
    positions,
    isReady: enabled,
    hasAwakeBodies,
    addCard,
    removeCard,
    applyEntranceBurst,
    updateSearchCard,
    updateTargets,
  };
}
