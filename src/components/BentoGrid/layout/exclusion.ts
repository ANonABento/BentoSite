import type { CardPosition, ExclusionZone, Rect } from '../BentoGrid.types';
import { GRID, SEARCH_CARD } from '../BentoGrid.constants';
import { rectsOverlap } from './positions';

function withPadding(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function getPaddedExclusion(exclusionZone: ExclusionZone): Rect {
  return withPadding(
    exclusionZone,
    exclusionZone.padding ?? SEARCH_CARD.EXCLUSION_PADDING,
  );
}

function pushRectOutOfRect(rect: CardPosition, obstacle: Rect): CardPosition {
  if (!rectsOverlap(rect, obstacle, 0)) return rect;

  const moves = [
    { x: obstacle.x - (rect.x + rect.width), y: 0 },
    { x: obstacle.x + obstacle.width - rect.x, y: 0 },
    { x: 0, y: obstacle.y - (rect.y + rect.height) },
    { x: 0, y: obstacle.y + obstacle.height - rect.y },
  ];
  const bestMove = moves.reduce((best, move) => {
    const distance = Math.abs(move.x) + Math.abs(move.y);
    const bestDistance = Math.abs(best.x) + Math.abs(best.y);
    return distance < bestDistance ? move : best;
  });

  return {
    ...rect,
    x: rect.x + bestMove.x,
    y: rect.y + bestMove.y,
  };
}

function pushMovingRectOutOfPlacedRects(
  moving: CardPosition,
  placed: CardPosition[],
): CardPosition {
  return placed.reduce((next, placedRect) => {
    if (!rectsOverlap(next, placedRect)) return next;

    const nextCenterX = next.x + next.width / 2;
    const nextCenterY = next.y + next.height / 2;
    const placedCenterX = placedRect.x + placedRect.width / 2;
    const placedCenterY = placedRect.y + placedRect.height / 2;
    const overlapLeft = next.x + next.width + GRID.GAP - placedRect.x;
    const overlapRight = placedRect.x + placedRect.width + GRID.GAP - next.x;
    const overlapTop = next.y + next.height + GRID.GAP - placedRect.y;
    const overlapBottom = placedRect.y + placedRect.height + GRID.GAP - next.y;
    const pushX = nextCenterX < placedCenterX ? -overlapLeft : overlapRight;
    const pushY = nextCenterY < placedCenterY ? -overlapTop : overlapBottom;

    if (Math.abs(pushX) < Math.abs(pushY)) {
      return { ...next, x: next.x + pushX };
    }

    return { ...next, y: next.y + pushY };
  }, moving);
}

export function preserveLayoutWithExclusion(
  currentPositions: Map<string, CardPosition>,
  exclusionZone: ExclusionZone,
): Map<string, CardPosition> {
  const paddedExclusion = getPaddedExclusion(exclusionZone);
  const nextPositions = new Map<string, CardPosition>();
  const entries = Array.from(currentPositions.entries()).sort(([, a], [, b]) => {
    const aOverlaps = rectsOverlap(a, paddedExclusion, 0) ? 1 : 0;
    const bOverlaps = rectsOverlap(b, paddedExclusion, 0) ? 1 : 0;
    return aOverlaps - bOverlaps;
  });
  const placed: CardPosition[] = [];

  entries.forEach(([cardId, original]) => {
    let next = pushRectOutOfRect(original, paddedExclusion);

    for (let iteration = 0; iteration < currentPositions.size + 2; iteration++) {
      const resolved = pushMovingRectOutOfPlacedRects(next, placed);
      if (resolved.x === next.x && resolved.y === next.y) break;
      next = pushRectOutOfRect(resolved, paddedExclusion);
    }

    nextPositions.set(cardId, next);
    placed.push(next);
  });

  return nextPositions;
}
