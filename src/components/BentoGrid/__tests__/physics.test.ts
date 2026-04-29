import { describe, expect, it } from 'vitest';
import type Matter from 'matter-js';
import { getCardDimensions } from '../BentoGrid.constants';
import type { CardPosition } from '../BentoGrid.types';
import { createPhysicsEngine, syncBodiesWithLayouts } from '../physics';

function layout(size: CardPosition['size']): CardPosition {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    size,
    ...getCardDimensions(size),
  };
}

function bodyWidth(body: Matter.Body): number {
  return body.bounds.max.x - body.bounds.min.x;
}

describe('BentoGrid physics sync', () => {
  it('recreates a body when an existing card layout changes size', () => {
    const engine = createPhysicsEngine(false);

    try {
      syncBodiesWithLayouts(engine, new Map([['card', layout('1x1')]]));
      const initialBody = engine.getBody('card');

      syncBodiesWithLayouts(engine, new Map([['card', layout('2x1')]]));
      const resizedBody = engine.getBody('card');

      expect(resizedBody).toBeDefined();
      expect(resizedBody).not.toBe(initialBody);
      expect(Math.round(bodyWidth(resizedBody!))).toBe(getCardDimensions('2x1').width);
    } finally {
      engine.destroy();
    }
  });
});
