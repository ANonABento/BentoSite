/**
 * Matter.js engine wrapper for BentoGrid.
 */

import Matter from 'matter-js';
import type {
  BodySyncResult,
  CardLayout,
  PhysicsConfig,
} from '../BentoGrid.types';
import { PHYSICS, PHYSICS_MOBILE } from '../BentoGrid.constants';

const { Engine, World, Bodies, Body, Runner, Events, Sleeping } = Matter;

interface BodyMetadata {
  width: number;
  height: number;
}

export interface AddBodyOptions {
  isStatic?: boolean;
}

export interface PhysicsEngine {
  engine: Matter.Engine;
  runner: Matter.Runner;
  bodies: Map<string, Matter.Body>;

  addBody: (id: string, layout: CardLayout, options?: AddBodyOptions) => Matter.Body;
  removeBody: (id: string) => void;
  getBody: (id: string) => Matter.Body | undefined;
  updateBodyLayout: (id: string, layout: CardLayout, options?: AddBodyOptions) => Matter.Body;

  setPosition: (id: string, x: number, y: number) => void;
  setPositionImmediate: (id: string, x: number, y: number) => void;
  setVelocity: (id: string, vx: number, vy: number) => void;
  setStatic: (id: string, isStatic: boolean) => void;
  wakeBody: (id: string) => void;
  wakeAllBodies: () => void;

  start: () => void;
  stop: () => void;
  destroy: () => void;
}

function getBodyMetadata(body: Matter.Body): BodyMetadata | undefined {
  return body.plugin?.bentoGrid as BodyMetadata | undefined;
}

function setBodyMetadata(body: Matter.Body, metadata: BodyMetadata): void {
  body.plugin = {
    ...body.plugin,
    bentoGrid: metadata,
  };
}

function dimensionsChanged(body: Matter.Body, layout: CardLayout): boolean {
  const metadata = getBodyMetadata(body);

  return (
    !metadata ||
    metadata.width !== layout.width ||
    metadata.height !== layout.height
  );
}

export function createPhysicsEngine(
  isMobile: boolean,
  onUpdate?: (bodies: Map<string, Matter.Body>) => void,
): PhysicsEngine {
  const config: PhysicsConfig = isMobile ? PHYSICS_MOBILE : PHYSICS;

  const engine = Engine.create({
    enableSleeping: true,
  });

  engine.gravity.x = 0;
  engine.gravity.y = 0;

  const runner = Runner.create({
    delta: 1000 / 60,
  });

  const bodies = new Map<string, Matter.Body>();
  let isRunning = false;
  let lastUpdateTime = 0;
  const updateInterval = 16;

  if (onUpdate) {
    Events.on(engine, 'afterUpdate', () => {
      const now = Date.now();
      if (now - lastUpdateTime < updateInterval) return;
      lastUpdateTime = now;

      onUpdate(bodies);
    });
  }

  function addBody(id: string, layout: CardLayout, options: AddBodyOptions = {}): Matter.Body {
    if (bodies.has(id)) {
      removeBody(id);
    }

    const isStatic = options.isStatic ?? false;
    const body = Bodies.rectangle(
      layout.x,
      layout.y,
      layout.width,
      layout.height,
      {
        label: id,
        isStatic,
        friction: config.friction,
        frictionAir: config.frictionAir,
        restitution: isStatic ? 0 : config.restitution,
        density: config.density,
        sleepThreshold: config.sleepThreshold,
        chamfer: { radius: Math.min(16, layout.width / 2, layout.height / 2) },
      },
    );

    setBodyMetadata(body, {
      width: layout.width,
      height: layout.height,
    });

    World.add(engine.world, body);
    bodies.set(id, body);

    return body;
  }

  function removeBody(id: string): void {
    const body = bodies.get(id);
    if (!body) return;

    World.remove(engine.world, body);
    bodies.delete(id);
  }

  function getBody(id: string): Matter.Body | undefined {
    return bodies.get(id);
  }

  function updateBodyLayout(
    id: string,
    layout: CardLayout,
    options: AddBodyOptions = {},
  ): Matter.Body {
    const existing = bodies.get(id);
    const shouldBeStatic = options.isStatic ?? existing?.isStatic ?? false;

    if (!existing) {
      return addBody(id, layout, { isStatic: shouldBeStatic });
    }

    if (dimensionsChanged(existing, layout)) {
      const velocity = { ...existing.velocity };
      const angularVelocity = existing.angularVelocity;
      const angle = existing.angle;
      const position = shouldBeStatic ? { x: layout.x, y: layout.y } : existing.position;
      const replacementLayout = {
        ...layout,
        x: position.x,
        y: position.y,
      };
      const replacement = addBody(id, replacementLayout, { isStatic: shouldBeStatic });

      Body.setAngle(replacement, angle);
      if (!shouldBeStatic) {
        Body.setVelocity(replacement, velocity);
        Body.setAngularVelocity(replacement, angularVelocity);
      }

      return replacement;
    }

    if (existing.isStatic !== shouldBeStatic) {
      Body.setStatic(existing, shouldBeStatic);
      existing.restitution = shouldBeStatic ? 0 : config.restitution;
    }

    return existing;
  }

  function setPosition(id: string, x: number, y: number): void {
    const body = bodies.get(id);
    if (!body) return;

    Body.setPosition(body, { x, y });
    Sleeping.set(body, false);
  }

  function setPositionImmediate(id: string, x: number, y: number): void {
    const body = bodies.get(id);
    if (!body) return;

    Body.setPosition(body, { x, y });
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    Sleeping.set(body, false);
  }

  function setVelocity(id: string, vx: number, vy: number): void {
    const body = bodies.get(id);
    if (!body) return;

    Body.setVelocity(body, { x: vx, y: vy });
    Sleeping.set(body, false);
  }

  function setStatic(id: string, isStatic: boolean): void {
    const body = bodies.get(id);
    if (!body || body.isStatic === isStatic) return;

    Body.setStatic(body, isStatic);
    body.restitution = isStatic ? 0 : config.restitution;
    Sleeping.set(body, false);
  }

  function wakeBody(id: string): void {
    const body = bodies.get(id);
    if (!body) return;

    Sleeping.set(body, false);
  }

  function wakeAllBodies(): void {
    for (const body of bodies.values()) {
      Sleeping.set(body, false);
    }
  }

  function start(): void {
    if (isRunning) return;

    Runner.run(runner, engine);
    isRunning = true;
  }

  function stop(): void {
    if (!isRunning) return;

    Runner.stop(runner);
    isRunning = false;
  }

  function destroy(): void {
    stop();
    Events.off(engine, 'afterUpdate');
    World.clear(engine.world, false);
    Engine.clear(engine);
    bodies.clear();
  }

  return {
    engine,
    runner,
    bodies,
    addBody,
    removeBody,
    getBody,
    updateBodyLayout,
    setPosition,
    setPositionImmediate,
    setVelocity,
    setStatic,
    wakeBody,
    wakeAllBodies,
    start,
    stop,
    destroy,
  };
}

export function syncBodiesWithLayouts(
  physicsEngine: PhysicsEngine,
  layouts: Map<string, CardLayout>,
  getIsStatic: (id: string, layout: CardLayout) => boolean = () => false,
): BodySyncResult {
  const result: BodySyncResult = {
    added: [],
    removed: [],
    updated: [],
  };
  const layoutIds = new Set(layouts.keys());
  const bodyIds = new Set(physicsEngine.bodies.keys());

  for (const id of bodyIds) {
    if (!layoutIds.has(id)) {
      physicsEngine.removeBody(id);
      result.removed.push(id);
    }
  }

  for (const [id, layout] of layouts) {
    const hadBody = bodyIds.has(id);
    physicsEngine.updateBodyLayout(id, layout, {
      isStatic: getIsStatic(id, layout),
    });

    if (hadBody) {
      result.updated.push(id);
    } else {
      result.added.push(id);
    }
  }

  return result;
}
