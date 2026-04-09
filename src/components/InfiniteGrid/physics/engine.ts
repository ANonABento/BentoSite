// Physics Engine Setup
// Matter.js world creation and body management

import Matter from 'matter-js';
import type { CardLayout, PhysicsConfig } from '../InfiniteGrid.types';
import { PHYSICS, PHYSICS_MOBILE } from '../InfiniteGrid.constants';

const { Engine, World, Bodies, Body, Runner, Events } = Matter;

export interface PhysicsEngine {
  engine: Matter.Engine;
  runner: Matter.Runner;
  bodies: Map<string, Matter.Body>;

  // Body management
  addBody: (id: string, layout: CardLayout, isStatic?: boolean) => Matter.Body;
  removeBody: (id: string) => void;
  getBody: (id: string) => Matter.Body | undefined;

  // Position/velocity
  setPosition: (id: string, x: number, y: number) => void;
  setPositionImmediate: (id: string, x: number, y: number) => void;
  setVelocity: (id: string, vx: number, vy: number) => void;
  setStatic: (id: string, isStatic: boolean) => void;
  wakeBody: (id: string) => void;

  // Lifecycle
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

/**
 * Create a new physics engine instance
 */
export function createPhysicsEngine(
  isMobile: boolean,
  onUpdate?: (bodies: Map<string, Matter.Body>) => void
): PhysicsEngine {
  const config: PhysicsConfig = isMobile ? PHYSICS_MOBILE : PHYSICS;

  // Create engine with no gravity (free-floating cards)
  const engine = Engine.create({
    enableSleeping: true,
  });

  engine.gravity.x = 0;
  engine.gravity.y = 0;

  // Create runner
  const runner = Runner.create({
    delta: 1000 / 60,
  });

  // Track bodies
  const bodies = new Map<string, Matter.Body>();

  // Throttled update callback
  let lastUpdateTime = 0;
  const updateInterval = 16; // ~60fps for React state (better visual sync)

  if (onUpdate) {
    Events.on(engine, 'afterUpdate', () => {
      const now = Date.now();
      if (now - lastUpdateTime < updateInterval) return;
      lastUpdateTime = now;

      onUpdate(bodies);
    });
  }


  /**
   * Add a rectangular body for a card
   * Static bodies (search card) push dynamic bodies (project cards)
   */
  function addBody(id: string, layout: CardLayout, isStatic = false): Matter.Body {
    // Remove existing body if present
    if (bodies.has(id)) {
      removeBody(id);
    }

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
        restitution: isStatic ? 0 : config.restitution, // No bounce on search card
        density: config.density,
        sleepThreshold: config.sleepThreshold,
        chamfer: { radius: 16 }, // Rounded corners
      }
    );

    World.add(engine.world, body);
    bodies.set(id, body);

    return body;
  }

  /**
   * Remove a body from the world
   */
  function removeBody(id: string): void {
    const body = bodies.get(id);
    if (body) {
      World.remove(engine.world, body);
      bodies.delete(id);
    }
  }

  /**
   * Get a body by ID
   */
  function getBody(id: string): Matter.Body | undefined {
    return bodies.get(id);
  }

  /**
   * Set body position directly (wakes body)
   */
  function setPosition(id: string, x: number, y: number): void {
    const body = bodies.get(id);
    if (body) {
      Body.setPosition(body, { x, y });
      body.isSleeping = false;
    }
  }

  /**
   * Set body position immediately without physics interaction
   * Used for static bodies (clamped search card) to teleport without collision
   */
  function setPositionImmediate(id: string, x: number, y: number): void {
    const body = bodies.get(id);
    if (body) {
      // Set position and zero out velocity
      Body.setPosition(body, { x, y });
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
    }
  }

  /**
   * Set body velocity
   */
  function setVelocity(id: string, vx: number, vy: number): void {
    const body = bodies.get(id);
    if (body) {
      Body.setVelocity(body, { x: vx, y: vy });
      body.isSleeping = false;
    }
  }

  /**
   * Set body static state
   */
  function setStatic(id: string, isStatic: boolean): void {
    const body = bodies.get(id);
    if (body) {
      Body.setStatic(body, isStatic);
    }
  }

  /**
   * Wake up a sleeping body
   */
  function wakeBody(id: string): void {
    const body = bodies.get(id);
    if (body) {
      body.isSleeping = false;
    }
  }

  /**
   * Start the physics simulation
   */
  function start(): void {
    Runner.run(runner, engine);
  }

  /**
   * Stop the physics simulation
   */
  function stop(): void {
    Runner.stop(runner);
  }

  /**
   * Clean up and destroy
   */
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
    setPosition,
    setPositionImmediate,
    setVelocity,
    setStatic,
    wakeBody,
    start,
    stop,
    destroy,
  };
}

/**
 * Sync physics bodies with layout changes
 * Adds new bodies, removes old ones, updates target positions
 */
export function syncBodiesWithLayouts(
  physicsEngine: PhysicsEngine,
  layouts: Map<string, CardLayout>,
  isStatic = false
): void {
  const layoutIds = new Set(layouts.keys());
  const bodyIds = new Set(physicsEngine.bodies.keys());

  // Remove bodies that no longer have layouts
  for (const id of bodyIds) {
    if (!layoutIds.has(id)) {
      physicsEngine.removeBody(id);
    }
  }

  // Add or update bodies for layouts
  for (const [id, layout] of layouts) {
    if (!bodyIds.has(id)) {
      physicsEngine.addBody(id, layout, isStatic);
    }
  }
}
