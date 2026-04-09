// usePhysicsWorld Hook
// React integration for Matter.js physics engine
// Simplified: single settling interval, no move interval race condition

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  CardLayout,
  PhysicsPosition,
  UsePhysicsWorldReturn,
  TransitionPhase,
} from '../InfiniteGrid.types';
import { PHYSICS, PHYSICS_MOBILE } from '../InfiniteGrid.constants';
import { createPhysicsEngine, syncBodiesWithLayouts, type PhysicsEngine } from './engine';
import { applySettlingForces, extractTargets } from './forces';

interface UsePhysicsWorldOptions {
  layouts: Map<string, CardLayout>;
  enabled: boolean;
  isMobile: boolean;
  transitionPhase: TransitionPhase;
}

export function usePhysicsWorld({
  layouts,
  enabled,
  isMobile,
  transitionPhase,
}: UsePhysicsWorldOptions): UsePhysicsWorldReturn {
  const [positions, setPositions] = useState<Map<string, PhysicsPosition>>(new Map());
  const [isReady, setIsReady] = useState(false);

  // Physics engine ref
  const engineRef = useRef<PhysicsEngine | null>(null);

  // Target positions for settling
  const targetsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Settling force interval
  const settlingIntervalRef = useRef<number | null>(null);

  // Track whether search card is currently clamped
  const isClampedRef = useRef(false);

  // Initialize physics engine
  useEffect(() => {
    if (!enabled) {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
        setIsReady(false);
      }
      return;
    }

    // Create engine with position update callback
    const engine = createPhysicsEngine(isMobile, (bodies) => {
      const newPositions = new Map<string, PhysicsPosition>();

      for (const [id, body] of bodies) {
        newPositions.set(id, {
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
        });
      }

      setPositions(newPositions);
    });

    engineRef.current = engine;
    engine.start();
    setIsReady(true);

    return () => {
      if (settlingIntervalRef.current) {
        clearInterval(settlingIntervalRef.current);
      }
      engine.destroy();
      engineRef.current = null;
      setIsReady(false);
    };
  }, [enabled, isMobile]);

  // Add search card as static body when physics is enabled (which means clamped)
  // It acts as a wall that pushes other cards out of the way
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isReady) return;

    // Get search card layout
    const searchLayout = layouts.get('__search__');
    if (!searchLayout) return;

    // Add search card as static body - it pushes other cards
    engine.addBody('__search__', searchLayout, true); // isStatic = true

    return () => {
      engine.removeBody('__search__');
    };
  }, [isReady, layouts]);

  // Sync bodies with layouts
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isReady) return;

    syncBodiesWithLayouts(engine, layouts, false);
    targetsRef.current = extractTargets(layouts);
  }, [layouts, isReady]);

  // Apply continuous settling forces - cards always try to return to bento positions
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isReady) return;

    // Clear any existing interval
    if (settlingIntervalRef.current) {
      clearInterval(settlingIntervalRef.current);
      settlingIntervalRef.current = null;
    }

    const config = isMobile ? PHYSICS_MOBILE : PHYSICS;
    // Use stronger settling during transitions
    const strength = transitionPhase === 'settling'
      ? config.settlingStrength * 3
      : config.settlingStrength;

    // Single settling interval - no competing intervals
    settlingIntervalRef.current = window.setInterval(() => {
      applySettlingForces(
        engine.bodies,
        targetsRef.current,
        strength
      );
    }, 16) as unknown as number;

    return () => {
      if (settlingIntervalRef.current) {
        clearInterval(settlingIntervalRef.current);
        settlingIntervalRef.current = null;
      }
    };
  }, [transitionPhase, isMobile, isReady]);

  /**
   * Update search card position when clamped
   * Moves the static search card body, which pushes other cards via collision
   */
  const updateSearchClampedPosition = useCallback((x: number, y: number, isClamped: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;

    const wasClampedBefore = isClampedRef.current;
    isClampedRef.current = isClamped;

    // Move search card to clamped position
    const searchBody = engine.getBody('__search__');
    if (searchBody) {
      // Set position - this will push other cards via collision
      engine.setPosition('__search__', x, y);
    }

    // Wake all bodies so they react to the collision
    for (const [, body] of engine.bodies) {
      body.isSleeping = false;
    }
  }, []);

  // Update target positions (for external control of settling)
  const updateTargets = useCallback((newLayouts: Map<string, CardLayout>) => {
    targetsRef.current = extractTargets(newLayouts);
  }, []);

  return {
    positions,
    isReady,
    updateSearchClampedPosition,
    updateTargets,
  };
}
