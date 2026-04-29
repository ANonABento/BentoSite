/**
 * Physics forces for BentoGrid cards.
 */

import Matter from 'matter-js';
import type { CardLayout, Point } from '../BentoGrid.types';

const { Body, Sleeping } = Matter;

export interface SettlingForceOptions {
  minDistance?: number;
  maxForce?: number;
}

export interface EntranceBurstOptions {
  includeIds?: Iterable<string>;
  random?: () => number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toIdSet(ids?: Iterable<string>): Set<string> | null {
  return ids ? new Set(ids) : null;
}

export function applySettlingForces(
  bodies: Map<string, Matter.Body>,
  targets: Map<string, Point>,
  strength: number,
  options: SettlingForceOptions = {},
): void {
  const minDistance = options.minDistance ?? 1;
  const maxForce = options.maxForce ?? Number.POSITIVE_INFINITY;

  for (const [id, body] of bodies) {
    if (body.isStatic) continue;

    const target = targets.get(id);
    if (!target) continue;

    const dx = target.x - body.position.x;
    const dy = target.y - body.position.y;
    const distance = Math.hypot(dx, dy);

    if (distance < minDistance) continue;

    const forceMagnitude = clamp(distance * strength, 0, maxForce);

    Body.applyForce(body, body.position, {
      x: (dx / distance) * forceMagnitude,
      y: (dy / distance) * forceMagnitude,
    });
    Sleeping.set(body, false);
  }
}

export function applyDamping(
  bodies: Map<string, Matter.Body>,
  factor: number,
): void {
  for (const body of bodies.values()) {
    if (body.isStatic) continue;

    Body.setVelocity(body, {
      x: body.velocity.x * factor,
      y: body.velocity.y * factor,
    });
    Body.setAngularVelocity(body, body.angularVelocity * factor);
  }
}

export function applyEntranceBurst(
  bodies: Map<string, Matter.Body>,
  centerX: number,
  centerY: number,
  strength = 8,
  options: EntranceBurstOptions = {},
): void {
  const includeIds = toIdSet(options.includeIds);
  const random = options.random ?? Math.random;

  for (const [id, body] of bodies) {
    if (body.isStatic || (includeIds && !includeIds.has(id))) continue;

    const dx = body.position.x - centerX;
    const dy = body.position.y - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance < 1) continue;

    const normalizedDistance = Math.max(distance, 100);
    const velocityScale = strength * (200 / normalizedDistance);

    Body.setVelocity(body, {
      x: (dx / distance) * velocityScale + (random() - 0.5) * 2,
      y: (dy / distance) * velocityScale + (random() - 0.5) * 2,
    });
    Body.setAngularVelocity(body, (random() - 0.5) * 0.1);
    Sleeping.set(body, false);
  }
}

export function wakeNearbyBodies(
  bodies: Map<string, Matter.Body>,
  point: Point,
  radius: number,
): void {
  for (const body of bodies.values()) {
    if (body.isStatic) continue;

    const dx = body.position.x - point.x;
    const dy = body.position.y - point.y;

    if (Math.hypot(dx, dy) < radius) {
      Sleeping.set(body, false);
    }
  }
}

export function extractTargets(layouts: Map<string, CardLayout>): Map<string, Point> {
  const targets = new Map<string, Point>();

  for (const [id, layout] of layouts) {
    targets.set(id, { x: layout.x, y: layout.y });
  }

  return targets;
}

export function areBodiesSettled(
  bodies: Map<string, Matter.Body>,
  velocityThreshold = 0.5,
): boolean {
  for (const body of bodies.values()) {
    if (body.isStatic || body.isSleeping) continue;

    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    if (speed > velocityThreshold) return false;
  }

  return true;
}
