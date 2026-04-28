import { describe, expect, it } from 'vitest';
import { SEARCH_CARD } from '../BentoGrid.constants';
import type { CardLayout } from '../BentoGrid.types';
import {
  createPhysicsEngine,
  syncBodiesWithLayouts,
} from '../physics/engine';
import {
  applyEntranceBurst,
  applySettlingForces,
  extractTargets,
} from '../physics/forces';

function createLayout(id: string, x = 0, y = 0): CardLayout {
  return {
    id,
    x,
    y,
    width: 180,
    height: 180,
    size: '1x1',
  };
}

describe('BentoGrid physics engine', () => {
  it('syncs cards as dynamic bodies by default', () => {
    const engine = createPhysicsEngine(false);
    const layouts = new Map([
      ['card-a', createLayout('card-a')],
      [SEARCH_CARD.PHYSICS_ID, createLayout(SEARCH_CARD.PHYSICS_ID, 220, 0)],
    ]);

    const result = syncBodiesWithLayouts(engine, layouts);

    expect(result.added).toEqual(['card-a', SEARCH_CARD.PHYSICS_ID]);
    expect(engine.getBody('card-a')?.isStatic).toBe(false);
    expect(engine.getBody(SEARCH_CARD.PHYSICS_ID)?.isStatic).toBe(false);

    engine.destroy();
  });

  it('can make the stuck search card static while leaving other cards dynamic', () => {
    const engine = createPhysicsEngine(false);
    const layouts = new Map([
      ['card-a', createLayout('card-a')],
      [SEARCH_CARD.PHYSICS_ID, createLayout(SEARCH_CARD.PHYSICS_ID, 220, 0)],
    ]);

    syncBodiesWithLayouts(
      engine,
      layouts,
      (id) => id === SEARCH_CARD.PHYSICS_ID,
    );

    expect(engine.getBody('card-a')?.isStatic).toBe(false);
    expect(engine.getBody(SEARCH_CARD.PHYSICS_ID)?.isStatic).toBe(true);

    engine.destroy();
  });

  it('reports added, updated, and removed bodies during layout sync', () => {
    const engine = createPhysicsEngine(false);
    const firstLayouts = new Map([
      ['card-a', createLayout('card-a')],
      ['card-b', createLayout('card-b')],
    ]);
    const nextLayouts = new Map([
      ['card-b', createLayout('card-b', 100, 0)],
      ['card-c', createLayout('card-c')],
    ]);

    syncBodiesWithLayouts(engine, firstLayouts);
    const result = syncBodiesWithLayouts(engine, nextLayouts);

    expect(result).toEqual({
      added: ['card-c'],
      removed: ['card-a'],
      updated: ['card-b'],
    });
    expect(engine.getBody('card-a')).toBeUndefined();
    expect(engine.getBody('card-b')).toBeDefined();
    expect(engine.getBody('card-c')).toBeDefined();

    engine.destroy();
  });

  it('preserves current position when resizing a stuck static body', () => {
    const engine = createPhysicsEngine(false);
    const layouts = new Map([
      [SEARCH_CARD.PHYSICS_ID, createLayout(SEARCH_CARD.PHYSICS_ID, 0, 0)],
    ]);

    syncBodiesWithLayouts(
      engine,
      layouts,
      (id) => id === SEARCH_CARD.PHYSICS_ID,
    );
    engine.setPositionImmediate(SEARCH_CARD.PHYSICS_ID, 320, 160);

    const resizedLayouts = new Map([
      [
        SEARCH_CARD.PHYSICS_ID,
        {
          ...createLayout(SEARCH_CARD.PHYSICS_ID, 0, 0),
          width: SEARCH_CARD.SQUASHED_SIDE_WIDTH,
        },
      ],
    ]);

    syncBodiesWithLayouts(
      engine,
      resizedLayouts,
      (id) => id === SEARCH_CARD.PHYSICS_ID,
    );

    const body = engine.getBody(SEARCH_CARD.PHYSICS_ID);
    expect(body?.isStatic).toBe(true);
    expect(body?.position.x).toBe(320);
    expect(body?.position.y).toBe(160);

    engine.destroy();
  });
});

describe('BentoGrid physics forces', () => {
  it('applies settling forces to regular and free search bodies', () => {
    const engine = createPhysicsEngine(false);
    const layouts = new Map([
      ['card-a', createLayout('card-a', 0, 0)],
      [SEARCH_CARD.PHYSICS_ID, createLayout(SEARCH_CARD.PHYSICS_ID, 0, 0)],
    ]);
    syncBodiesWithLayouts(engine, layouts);

    engine.setPosition('card-a', -100, 0);
    engine.setPosition(SEARCH_CARD.PHYSICS_ID, -100, 0);

    applySettlingForces(engine.bodies, extractTargets(layouts), 0.002, {
      maxForce: 0.08,
    });

    const cardBody = engine.getBody('card-a');
    const searchBody = engine.getBody(SEARCH_CARD.PHYSICS_ID);

    expect(cardBody?.force.x).toBeGreaterThan(0);
    expect(searchBody?.force.x).toBeGreaterThan(0);

    engine.destroy();
  });

  it('does not apply settling forces to static stuck bodies', () => {
    const engine = createPhysicsEngine(false);
    const layouts = new Map([
      [SEARCH_CARD.PHYSICS_ID, createLayout(SEARCH_CARD.PHYSICS_ID, 0, 0)],
    ]);
    syncBodiesWithLayouts(
      engine,
      layouts,
      (id) => id === SEARCH_CARD.PHYSICS_ID,
    );

    engine.setPositionImmediate(SEARCH_CARD.PHYSICS_ID, -100, 0);
    applySettlingForces(engine.bodies, extractTargets(layouts), 0.002, {
      maxForce: 0.08,
    });

    expect(engine.getBody(SEARCH_CARD.PHYSICS_ID)?.force.x).toBe(0);

    engine.destroy();
  });

  it('limits entrance burst to newly added cards', () => {
    const engine = createPhysicsEngine(false);
    syncBodiesWithLayouts(engine, new Map([
      ['existing', createLayout('existing', 100, 0)],
      ['added', createLayout('added', 100, 0)],
    ]));

    applyEntranceBurst(engine.bodies, 0, 0, 8, {
      includeIds: ['added'],
      random: () => 0.5,
    });

    expect(engine.getBody('existing')?.velocity.x).toBe(0);
    expect(engine.getBody('added')?.velocity.x).toBeGreaterThan(0);

    engine.destroy();
  });
});
