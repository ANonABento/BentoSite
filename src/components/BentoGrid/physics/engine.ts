import Matter from 'matter-js';
import type { CardPosition, PhysicsConfig, Position } from '../BentoGrid.types';
import { PHYSICS, PHYSICS_MOBILE, SEARCH_CARD_ID } from '../BentoGrid.constants';
import { applyEntranceBurstToBody, toBodyCenter } from './forces';

const { Bodies, Body, Engine, Events, Runner, Sleeping, World } = Matter;

export interface PhysicsEngine {
  engine: Matter.Engine;
  runner: Matter.Runner;
  bodies: Map<string, Matter.Body>;
  layouts: Map<string, CardPosition>;
  addBody: (id: string, layout: CardPosition, isStatic?: boolean) => Matter.Body;
  removeBody: (id: string) => void;
  getBody: (id: string) => Matter.Body | undefined;
  setPosition: (id: string, x: number, y: number) => void;
  setVelocity: (id: string, vx: number, vy: number) => void;
  setStatic: (id: string, isStatic: boolean) => void;
  applyEntranceBurst: (id: string, center: Position, strength?: number) => void;
  wakeBody: (id: string) => void;
  wakeAllBodies: () => void;
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

export function createPhysicsEngine(
  isMobile: boolean,
  onUpdate?: (bodies: Map<string, Matter.Body>, layouts: Map<string, CardPosition>) => void,
): PhysicsEngine {
  const config: PhysicsConfig = isMobile ? PHYSICS_MOBILE : PHYSICS;
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.x = 0;
  engine.gravity.y = 0;

  const runner = Runner.create({ delta: 1000 / 60 });
  const bodies = new Map<string, Matter.Body>();
  const layouts = new Map<string, CardPosition>();
  let lastUpdateTime = 0;

  if (onUpdate) {
    Events.on(engine, 'afterUpdate', () => {
      const now = Date.now();
      if (now - lastUpdateTime < 16) return;
      lastUpdateTime = now;
      onUpdate(bodies, layouts);
    });
  }

  function addBody(id: string, layout: CardPosition, isStatic = false): Matter.Body {
    if (bodies.has(id)) {
      removeBody(id);
    }

    const center = toBodyCenter(layout);
    const body = Bodies.rectangle(center.x, center.y, layout.width, layout.height, {
      label: id,
      isStatic,
      angle: (layout.rotation * Math.PI) / 180,
      friction: config.friction,
      frictionAir: config.frictionAir,
      restitution: isStatic ? 0 : config.restitution,
      density: config.density,
      sleepThreshold: config.sleepThreshold,
      chamfer: { radius: 16 },
    });

    World.add(engine.world, body);
    bodies.set(id, body);
    layouts.set(id, layout);

    return body;
  }

  function removeBody(id: string): void {
    const body = bodies.get(id);
    if (!body) return;

    World.remove(engine.world, body);
    bodies.delete(id);
    layouts.delete(id);
  }

  function getBody(id: string): Matter.Body | undefined {
    return bodies.get(id);
  }

  function setPosition(id: string, x: number, y: number): void {
    const body = bodies.get(id);
    if (!body) return;

    Body.setPosition(body, { x, y });
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
    if (!body) return;

    Body.setStatic(body, isStatic);
    Sleeping.set(body, false);
  }

  function applyBodyEntranceBurst(id: string, center: Position, strength?: number): void {
    const body = bodies.get(id);
    if (!body) return;

    applyEntranceBurstToBody(body, center, strength);
  }

  function wakeBody(id: string): void {
    const body = bodies.get(id);
    if (body) Sleeping.set(body, false);
  }

  function wakeAllBodies(): void {
    bodies.forEach((body) => Sleeping.set(body, false));
  }

  function start(): void {
    Runner.run(runner, engine);
  }

  function stop(): void {
    Runner.stop(runner);
  }

  function destroy(): void {
    stop();
    Events.off(engine, 'afterUpdate');
    World.clear(engine.world, false);
    Engine.clear(engine);
    bodies.clear();
    layouts.clear();
  }

  return {
    engine,
    runner,
    bodies,
    layouts,
    addBody,
    removeBody,
    getBody,
    setPosition,
    setVelocity,
    setStatic,
    applyEntranceBurst: applyBodyEntranceBurst,
    wakeBody,
    wakeAllBodies,
    start,
    stop,
    destroy,
  };
}

export function syncBodiesWithLayouts(
  physicsEngine: PhysicsEngine,
  layouts: Map<string, CardPosition>,
  isStatic = false,
): void {
  const layoutIds = new Set(layouts.keys());
  const bodyIds = new Set(physicsEngine.bodies.keys());

  bodyIds.forEach((id) => {
    if (id !== SEARCH_CARD_ID && !layoutIds.has(id)) {
      physicsEngine.removeBody(id);
    }
  });

  layouts.forEach((layout, id) => {
    if (!bodyIds.has(id)) {
      physicsEngine.addBody(id, layout, isStatic);
      return;
    }

    const existingLayout = physicsEngine.layouts.get(id);
    if (
      existingLayout &&
      (existingLayout.width !== layout.width || existingLayout.height !== layout.height)
    ) {
      const existingBody = physicsEngine.getBody(id);
      physicsEngine.removeBody(id);
      physicsEngine.addBody(id, layout, existingBody?.isStatic ?? isStatic);
      return;
    }

    physicsEngine.layouts.set(id, layout);
  });
}
