'use client';

/**
 * React binding for the always-on BentoGrid Matter.js world.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CardLayout,
  PhysicsPosition,
  Point,
  TransitionPhase,
  UsePhysicsWorldReturn,
} from '../BentoGrid.types';
import {
  PHYSICS,
  PHYSICS_MOBILE,
  PHYSICS_RUNTIME,
  SEARCH_CARD,
} from '../BentoGrid.constants';
import {
  createPhysicsEngine,
  syncBodiesWithLayouts,
  type PhysicsEngine,
} from './engine';
import {
  applyDamping,
  applyEntranceBurst,
  applySettlingForces,
  extractTargets,
} from './forces';

interface UsePhysicsWorldOptions {
  layouts: Map<string, CardLayout>;
  isMobile: boolean;
  transitionPhase?: TransitionPhase;
  searchCardId?: string;
  entranceBurstCenter?: Point;
}

const DEFAULT_ENTRANCE_BURST_CENTER: Point = { x: 0, y: 0 };

export function usePhysicsWorld({
  layouts,
  isMobile,
  transitionPhase = 'idle',
  searchCardId = SEARCH_CARD.PHYSICS_ID,
  entranceBurstCenter = DEFAULT_ENTRANCE_BURST_CENTER,
}: UsePhysicsWorldOptions): UsePhysicsWorldReturn {
  const [positions, setPositions] = useState<Map<string, PhysicsPosition>>(new Map());
  const [isReady, setIsReady] = useState(false);

  const engineRef = useRef<PhysicsEngine | null>(null);
  const targetsRef = useRef<Map<string, Point>>(new Map());
  const staticBodyIdsRef = useRef<Set<string>>(new Set());
  const settlingIntervalRef = useRef<number | null>(null);
  const latestEntranceBurstCenterRef = useRef(entranceBurstCenter);

  useEffect(() => {
    latestEntranceBurstCenterRef.current = entranceBurstCenter;
  }, [entranceBurstCenter]);

  useEffect(() => {
    const engine = createPhysicsEngine(isMobile, (bodies) => {
      const nextPositions = new Map<string, PhysicsPosition>();

      for (const [id, body] of bodies) {
        nextPositions.set(id, {
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
        });
      }

      setPositions(nextPositions);
    });

    engineRef.current = engine;
    engine.start();
    setIsReady(true);

    return () => {
      if (settlingIntervalRef.current !== null) {
        window.clearInterval(settlingIntervalRef.current);
        settlingIntervalRef.current = null;
      }

      engine.destroy();
      engineRef.current = null;
      setIsReady(false);
    };
  }, [isMobile]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const syncResult = syncBodiesWithLayouts(
      engine,
      layouts,
      (id) => staticBodyIdsRef.current.has(id),
    );

    targetsRef.current = extractTargets(layouts);

    if (syncResult.added.length > 0) {
      const config = isMobile ? PHYSICS_MOBILE : PHYSICS;
      applyEntranceBurst(
        engine.bodies,
        latestEntranceBurstCenterRef.current.x,
        latestEntranceBurstCenterRef.current.y,
        config.entranceBurstStrength,
        { includeIds: syncResult.added },
      );
    }
  }, [isMobile, layouts]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (settlingIntervalRef.current !== null) {
      window.clearInterval(settlingIntervalRef.current);
      settlingIntervalRef.current = null;
    }

    const config = isMobile ? PHYSICS_MOBILE : PHYSICS;
    const strength = transitionPhase === 'settling'
      ? config.settlingStrength * 3
      : config.settlingStrength;

    settlingIntervalRef.current = window.setInterval(() => {
      applySettlingForces(engine.bodies, targetsRef.current, strength, {
        maxForce: config.maxSettlingForce,
      });
      applyDamping(engine.bodies, config.damping);
    }, PHYSICS_RUNTIME.FRAME_MS);

    return () => {
      if (settlingIntervalRef.current !== null) {
        window.clearInterval(settlingIntervalRef.current);
        settlingIntervalRef.current = null;
      }
    };
  }, [isMobile, transitionPhase]);

  const updateSearchClampedPosition = useCallback((
    x: number,
    y: number,
    isStuck: boolean,
  ) => {
    const engine = engineRef.current;

    if (isStuck) {
      staticBodyIdsRef.current.add(searchCardId);
    } else {
      staticBodyIdsRef.current.delete(searchCardId);
    }

    if (!engine) return;

    const searchBody = engine.getBody(searchCardId);
    if (!searchBody) return;

    engine.setStatic(searchCardId, isStuck);

    if (isStuck) {
      engine.setPositionImmediate(searchCardId, x, y);
      engine.wakeAllBodies();
    } else {
      engine.wakeBody(searchCardId);
      engine.wakeAllBodies();
    }
  }, [searchCardId]);

  const updateTargets = useCallback((newLayouts: Map<string, CardLayout>) => {
    targetsRef.current = extractTargets(newLayouts);
  }, []);

  const applyEntranceBurstToCards = useCallback((
    cardIds: Iterable<string>,
    center: Point = latestEntranceBurstCenterRef.current,
    strength?: number,
  ) => {
    const engine = engineRef.current;
    if (!engine) return;

    const config = isMobile ? PHYSICS_MOBILE : PHYSICS;
    applyEntranceBurst(
      engine.bodies,
      center.x,
      center.y,
      strength ?? config.entranceBurstStrength,
      { includeIds: cardIds },
    );
  }, [isMobile]);

  return {
    positions,
    isReady,
    updateSearchClampedPosition,
    updateTargets,
    applyEntranceBurstToCards,
  };
}
