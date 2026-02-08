/**
 * Physics Engine Hook - Handles gravity and collision for all cards
 */

import { useCallback, useRef } from 'react';
import { CardPosition, CardPhysicsState } from '../BentoHub.types';
import { PHYSICS } from '../BentoHub.config';
import {
  boxesOverlap,
  getOverlapInfo,
  getOffsetBox,
  getCenter,
  distance,
  Vector2,
} from './collision.utils';

interface PhysicsEngineOptions {
  centerPoint: Vector2;
  onUpdate: (cardId: string, force: Vector2) => void;
}

export function usePhysicsEngine(options: PhysicsEngineOptions) {
  const { centerPoint, onUpdate } = options;
  const cardsRef = useRef<Map<string, CardPhysicsState>>(new Map());

  // Register a card with the physics engine
  const registerCard = useCallback((id: string, homePosition: CardPosition) => {
    cardsRef.current.set(id, {
      id,
      homePosition,
      currentOffset: { x: 0, y: 0 },
      isDragging: false,
    });
  }, []);

  // Unregister a card
  const unregisterCard = useCallback((id: string) => {
    cardsRef.current.delete(id);
  }, []);

  // Update card position (called during drag)
  const updateCardOffset = useCallback((id: string, offset: Vector2) => {
    const card = cardsRef.current.get(id);
    if (card) {
      card.currentOffset = offset;
    }
  }, []);

  // Set dragging state
  const setDragging = useCallback((id: string, isDragging: boolean) => {
    const card = cardsRef.current.get(id);
    if (card) {
      card.isDragging = isDragging;
    }
  }, []);

  // Calculate forces for a specific card
  const calculateForces = useCallback((cardId: string): Vector2 => {
    const card = cardsRef.current.get(cardId);
    if (!card) return { x: 0, y: 0 };

    const force: Vector2 = { x: 0, y: 0 };
    const cardBox = getOffsetBox(card.homePosition, card.currentOffset);
    const cardCenter = getCenter(cardBox);

    // 1. Gravity toward center (only when not dragging)
    if (!card.isDragging) {
      const distToCenter = distance(cardCenter, centerPoint);

      if (distToCenter < PHYSICS.centerPullRadius && distToCenter > 1) {
        // Gravity strength increases as card gets further from center
        const gravityMagnitude = PHYSICS.gravityStrength * (distToCenter / PHYSICS.centerPullRadius);

        // Direction toward center
        const dx = centerPoint.x - cardCenter.x;
        const dy = centerPoint.y - cardCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        force.x += (dx / dist) * gravityMagnitude;
        force.y += (dy / dist) * gravityMagnitude;
      }
    }

    // 2. Collision with other cards
    cardsRef.current.forEach((otherCard, otherId) => {
      if (otherId === cardId) return;
      if (otherCard.homePosition.width === 0) return; // Skip void or invalid cards

      const otherBox = getOffsetBox(otherCard.homePosition, otherCard.currentOffset);

      if (boxesOverlap(cardBox, otherBox, PHYSICS.collisionPadding)) {
        const overlapInfo = getOverlapInfo(cardBox, otherBox, PHYSICS.collisionPadding);

        if (overlapInfo) {
          // Push force proportional to overlap
          const pushMagnitude = overlapInfo.overlap * PHYSICS.collisionForce;

          force.x += overlapInfo.direction.x * pushMagnitude;
          force.y += overlapInfo.direction.y * pushMagnitude;
        }
      }
    });

    return force;
  }, [centerPoint]);

  // Run one physics step for all cards
  const step = useCallback(() => {
    cardsRef.current.forEach((card, id) => {
      // Skip void cards
      if (card.homePosition.width === 0) return;

      const force = calculateForces(id);

      // Only apply forces if significant
      if (Math.abs(force.x) > 0.001 || Math.abs(force.y) > 0.001) {
        onUpdate(id, force);
      }
    });
  }, [calculateForces, onUpdate]);

  return {
    registerCard,
    unregisterCard,
    updateCardOffset,
    setDragging,
    calculateForces,
    step,
  };
}

export type PhysicsEngine = ReturnType<typeof usePhysicsEngine>;
