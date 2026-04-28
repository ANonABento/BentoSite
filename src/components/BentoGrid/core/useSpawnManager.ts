import { useCallback, useEffect, useRef } from 'react';
import type {
  Camera,
  CardSize,
  SpawnEdge,
  SpawnPhysicsBridge,
  UseCardPoolReturn,
  UseSpawnManagerReturn,
  UseViewportReturn,
} from '../BentoGrid.types';
import { GRID, QUEUE } from '../BentoGrid.constants';
import { getCardDimensions, getCardSizeForIndex, getRandomRotation } from '../layout';

interface UseSpawnManagerOptions {
  cardPool: UseCardPoolReturn;
  viewport: UseViewportReturn;
  camera: Camera;
  rotationRange?: number;
  enabled?: boolean;
  physics?: SpawnPhysicsBridge;
}

export const MOVEMENT_THRESHOLD = 5;

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

function getCardSizeForSpawn(spawnIndex: number): CardSize {
  return getCardSizeForIndex(spawnIndex);
}

export function useSpawnManager(options: UseSpawnManagerOptions): UseSpawnManagerReturn {
  const {
    cardPool,
    viewport,
    camera,
    rotationRange = 0,
    enabled = true,
    physics,
  } = options;

  const lastCameraRef = useRef<Camera>({ ...camera });
  const spawnCountRef = useRef(0);

  const getMovementDirection = useCallback(
    (): SpawnEdge | null =>
      getMovementDirectionFromDelta(
        camera.x - lastCameraRef.current.x,
        camera.y - lastCameraRef.current.y,
      ),
    [camera],
  );

  const spawnAtEdge = useCallback(
    (edge: SpawnEdge): boolean => {
      const queuedCard = cardPool.dequeue();
      if (!queuedCard) return false;

      const size = getCardSizeForSpawn(spawnCountRef.current);
      const dimensions = getCardDimensions(size);
      const basePosition = viewport.getSpawnPosition(edge);
      let x = basePosition.x;
      let y = basePosition.y;

      if (edge === 'left') x = basePosition.x - dimensions.width;
      if (edge === 'top') y = basePosition.y - dimensions.height;

      const position = {
        x,
        y,
        rotation: getRandomRotation(rotationRange),
        size,
        width: dimensions.width,
        height: dimensions.height,
      };

      cardPool.addVisible(queuedCard.id, position);
      physics?.addCard(queuedCard.id, position);
      physics?.applyEntranceBurst(queuedCard.id, {
        x: viewport.bounds.left + viewport.bounds.width / 2,
        y: viewport.bounds.top + viewport.bounds.height / 2,
      });
      spawnCountRef.current++;

      return true;
    },
    [cardPool, physics, rotationRange, viewport],
  );

  const checkDespawns = useCallback((): boolean => {
    const toRemove: string[] = [];

    cardPool.visible.forEach((position, cardId) => {
      if (!viewport.isCardInViewport(position, GRID.DESPAWN_BUFFER)) {
        toRemove.push(cardId);
      }
    });

    toRemove.forEach((cardId) => {
      physics?.removeCard(cardId);
      cardPool.removeVisible(cardId);
    });

    return toRemove.length > 0;
  }, [cardPool, physics, viewport]);

  const checkSpawns = useCallback(() => {
    if (cardPool.queue.length === 0) return;
    if (cardPool.visible.size >= QUEUE.MAX_VISIBLE) return;

    const spawnEdge = getMovementDirection();
    if (!spawnEdge) return;

    spawnAtEdge(spawnEdge);
  }, [cardPool, getMovementDirection, spawnAtEdge]);

  const tick = useCallback(() => {
    if (!enabled) return;

    checkDespawns();
    checkSpawns();
    lastCameraRef.current = { ...camera };
  }, [camera, checkDespawns, checkSpawns, enabled]);

  const forceSpawn = useCallback(
    (edge: SpawnEdge) => {
      spawnAtEdge(edge);
    },
    [spawnAtEdge],
  );

  useEffect(() => {
    if (!enabled) return;

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
