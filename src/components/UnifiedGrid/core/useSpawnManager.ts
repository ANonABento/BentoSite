/**
 * useSpawnManager - Card Spawn/Despawn Logic
 *
 * Orchestrates the spawning and despawning of cards as the user
 * navigates the infinite grid. Works with the card queue to:
 * - Detect cards exiting the viewport
 * - Determine spawn positions on opposite edges
 * - Apply organic delays for natural feel
 */

import { useCallback, useEffect, useRef } from 'react';
import type {
  CardPosition,
  SpawnEdge,
  UseCardQueueReturn,
  UseViewportReturn,
  Camera,
} from '../UnifiedGrid.types';
import { QUEUE, GRID, getCardDimensions } from '../UnifiedGrid.constants';

interface UseSpawnManagerOptions {
  /** Card queue state and methods */
  cardQueue: UseCardQueueReturn;
  /** Viewport state and methods */
  viewport: UseViewportReturn;
  /** Current camera state */
  camera: Camera;
  /** Theme rotation range for spawned cards */
  rotationRange?: number;
  /** Whether spawning is enabled */
  enabled?: boolean;
}

interface UseSpawnManagerReturn {
  /** Check for cards to despawn and spawn */
  tick: () => void;
  /** Force spawn a card at a specific edge */
  forceSpawn: (edge: SpawnEdge) => void;
}

/**
 * Get a random rotation within range
 */
function getRandomRotation(range: number): number {
  if (range === 0) return 0;
  return (Math.random() - 0.5) * 2 * range;
}

/** Movement threshold (px) before a camera delta counts as a pan direction */
export const MOVEMENT_THRESHOLD = 5;

/**
 * Determine which edge of the viewport the user is exploring toward, given a
 * camera delta. Pure helper exported for testing.
 *
 * Sign convention: when the user drags content right, camera.x increases and
 * the viewport in canvas-space shifts left, exposing the LEFT side of canvas.
 * So a positive dx returns 'left' — the side the user is heading toward, where
 * new cards should spawn.
 */
export function getMovementDirectionFromDelta(
  dx: number,
  dy: number,
  threshold: number = MOVEMENT_THRESHOLD,
): SpawnEdge | null {
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > threshold) return 'left';
    if (dx < -threshold) return 'right';
  } else {
    if (dy > threshold) return 'top';
    if (dy < -threshold) return 'bottom';
  }
  return null;
}

/**
 * Determine card size based on index pattern
 */
function getCardSizeForSpawn(queuePosition: number): '1x1' | '2x1' | '1x2' | '2x2' {
  // Simple pattern for variety
  const pattern: Array<'1x1' | '2x1' | '1x2' | '2x2'> = [
    '1x1', '1x1', '2x1', '1x1', '1x2', '1x1', '1x1', '1x1',
  ];
  return pattern[queuePosition % pattern.length];
}

export function useSpawnManager(options: UseSpawnManagerOptions): UseSpawnManagerReturn {
  const {
    cardQueue,
    viewport,
    camera,
    rotationRange = 0,
    enabled = true,
  } = options;

  // Track camera movement direction
  const lastCameraRef = useRef<Camera>({ ...camera });
  const spawnCountRef = useRef(0);

  const getMovementDirection = useCallback((): SpawnEdge | null => {
    return getMovementDirectionFromDelta(
      camera.x - lastCameraRef.current.x,
      camera.y - lastCameraRef.current.y,
    );
  }, [camera]);

  /**
   * Spawn a card at the specified edge
   */
  const spawnAtEdge = useCallback((edge: SpawnEdge): boolean => {
    const queuedCard = cardQueue.dequeue();
    if (!queuedCard) return false;

    const size = getCardSizeForSpawn(spawnCountRef.current);
    const dimensions = getCardDimensions(size);
    const basePosition = viewport.getSpawnPosition(edge);

    // Adjust position so card is just outside viewport
    let x = basePosition.x;
    let y = basePosition.y;

    switch (edge) {
      case 'left':
        x = basePosition.x - dimensions.width;
        break;
      case 'right':
        // Already positioned correctly
        break;
      case 'top':
        y = basePosition.y - dimensions.height;
        break;
      case 'bottom':
        // Already positioned correctly
        break;
    }

    const position: CardPosition = {
      x,
      y,
      rotation: getRandomRotation(rotationRange),
      size,
      width: dimensions.width,
      height: dimensions.height,
    };

    cardQueue.addVisible(queuedCard.id, position);
    spawnCountRef.current++;

    return true;
  }, [cardQueue, viewport, rotationRange]);

  /**
   * Check for cards that need to be despawned
   */
  const checkDespawns = useCallback(() => {
    const toRemove: string[] = [];

    cardQueue.visible.forEach((position, cardId) => {
      if (!viewport.isCardInViewport(position, GRID.DESPAWN_BUFFER)) {
        toRemove.push(cardId);
      }
    });

    toRemove.forEach((cardId) => {
      cardQueue.removeVisible(cardId);
    });

    return toRemove.length > 0;
  }, [cardQueue, viewport]);

  /**
   * Check if we need to spawn more cards
   */
  const checkSpawns = useCallback(() => {
    // Don't spawn if queue is empty
    if (cardQueue.queue.length === 0) return;

    // Don't spawn if we're at max visible
    if (cardQueue.visible.size >= QUEUE.MAX_VISIBLE) return;

    // Spawn on the edge the user is exploring toward (returned by
    // getMovementDirection). Card stays at its canvas-space position; as the
    // viewport keeps shifting in that direction, the card slides into view.
    const spawnEdge = getMovementDirection();
    if (!spawnEdge) return;

    spawnAtEdge(spawnEdge);
  }, [cardQueue, getMovementDirection, spawnAtEdge]);

  /**
   * Main tick function - called on animation frame
   */
  const tick = useCallback(() => {
    if (!enabled) return;

    // First check for cards to despawn
    checkDespawns();

    // Then check if we need to spawn new cards
    checkSpawns();

    // Update last camera position
    lastCameraRef.current = { ...camera };
  }, [enabled, checkDespawns, checkSpawns, camera]);

  /**
   * Force spawn at a specific edge (for testing/debugging)
   */
  const forceSpawn = useCallback((edge: SpawnEdge) => {
    spawnAtEdge(edge);
  }, [spawnAtEdge]);

  // Run tick on camera changes
  useEffect(() => {
    if (!enabled) return;

    // Only tick if camera actually moved
    const dx = Math.abs(camera.x - lastCameraRef.current.x);
    const dy = Math.abs(camera.y - lastCameraRef.current.y);

    if (dx > 1 || dy > 1) {
      tick();
    }
  }, [camera, enabled, tick]);

  return {
    tick,
    forceSpawn,
  };
}
