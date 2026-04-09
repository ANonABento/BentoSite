// Physics Forces
// Force calculations for settling and interactions

import Matter from 'matter-js';
import type { Point, CardLayout } from '../InfiniteGrid.types';

const { Body } = Matter;

/**
 * Apply settling force to move bodies toward their target positions
 * Used after filter changes to smoothly transition cards to new positions
 */
export function applySettlingForces(
  bodies: Map<string, Matter.Body>,
  targets: Map<string, Point>,
  strength: number
): void {
  for (const [id, body] of bodies) {
    // Skip static bodies and search card (search card moves via velocity, not settling)
    if (body.isStatic || id === '__search__') continue;

    const target = targets.get(id);
    if (!target) continue;

    // Calculate direction and distance to target
    const dx = target.x - body.position.x;
    const dy = target.y - body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Skip if already at target
    if (distance < 1) continue;

    // Apply proportional force toward target
    const forceMagnitude = distance * strength;
    const force = {
      x: (dx / distance) * forceMagnitude,
      y: (dy / distance) * forceMagnitude,
    };

    Body.applyForce(body, body.position, force);
    body.isSleeping = false;
  }
}

/**
 * Wake up bodies within a radius of a point
 * Useful when the search card moves near other cards
 */
export function wakeNearbyBodies(
  bodies: Map<string, Matter.Body>,
  point: Point,
  radius: number
): void {
  for (const [id, body] of bodies) {
    // Skip search card - it's controlled separately via velocity
    if (id === '__search__') continue;

    const dx = body.position.x - point.x;
    const dy = body.position.y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius) {
      body.isSleeping = false;
    }
  }
}

/**
 * Extract target positions from layouts
 */
export function extractTargets(layouts: Map<string, CardLayout>): Map<string, Point> {
  const targets = new Map<string, Point>();

  for (const [id, layout] of layouts) {
    targets.set(id, { x: layout.x, y: layout.y });
  }

  return targets;
}

/**
 * Check if all bodies have settled (velocity below threshold)
 */
export function areBodiesSettled(
  bodies: Map<string, Matter.Body>,
  velocityThreshold = 0.5
): boolean {
  for (const [, body] of bodies) {
    if (body.isStatic || body.isSleeping) continue;

    const speed = Math.sqrt(
      body.velocity.x * body.velocity.x +
      body.velocity.y * body.velocity.y
    );

    if (speed > velocityThreshold) {
      return false;
    }
  }

  return true;
}

/**
 * Apply damping to slow down all bodies
 */
export function applyDamping(
  bodies: Map<string, Matter.Body>,
  factor: number
): void {
  for (const [id, body] of bodies) {
    if (body.isStatic || id === '__search__') continue;

    Body.setVelocity(body, {
      x: body.velocity.x * factor,
      y: body.velocity.y * factor,
    });

    Body.setAngularVelocity(body, body.angularVelocity * factor);
  }
}

/**
 * Apply initial entrance burst - push bodies outward then let them settle
 * Creates a bouncy "explosion" effect on entrance
 */
export function applyEntranceBurst(
  bodies: Map<string, Matter.Body>,
  centerX: number,
  centerY: number,
  strength: number = 8
): void {
  for (const [id, body] of bodies) {
    // Skip search card
    if (body.isStatic || id === '__search__') continue;

    // Calculate direction from center
    const dx = body.position.x - centerX;
    const dy = body.position.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) continue;

    // Normalize and apply outward velocity (inversely proportional to distance for more uniform spread)
    const normalizedDist = Math.max(distance, 100);
    const velocityScale = strength * (200 / normalizedDist);

    Body.setVelocity(body, {
      x: (dx / distance) * velocityScale + (Math.random() - 0.5) * 2,
      y: (dy / distance) * velocityScale + (Math.random() - 0.5) * 2,
    });

    // Small random spin for visual interest
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);

    body.isSleeping = false;
  }
}
