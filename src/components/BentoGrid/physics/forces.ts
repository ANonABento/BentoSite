import Matter from 'matter-js';
import type { CardPosition, Position } from '../BentoGrid.types';
import { INFO_CARD_ID } from '../BentoGrid.constants';

const { Body, Sleeping } = Matter;

export function toBodyCenter(layout: CardPosition): Position {
  return {
    x: layout.x + layout.width / 2,
    y: layout.y + layout.height / 2,
  };
}

export function toTopLeft(body: Matter.Body, layout: CardPosition): Position {
  return {
    x: body.position.x - layout.width / 2,
    y: body.position.y - layout.height / 2,
  };
}

export function extractTargets(layouts: Map<string, CardPosition>): Map<string, Position> {
  const targets = new Map<string, Position>();

  layouts.forEach((layout, id) => {
    targets.set(id, toBodyCenter(layout));
  });

  return targets;
}

/** Snap threshold — if a body is within this many pixels of its target, lock it. */
const SNAP_DISTANCE = 3;

export function applySettlingForces(
  bodies: Map<string, Matter.Body>,
  targets: Map<string, Position>,
  strength: number,
): void {
  bodies.forEach((body, id) => {
    if (body.isStatic || id === INFO_CARD_ID) return;

    const target = targets.get(id);
    if (!target) return;

    const dx = target.x - body.position.x;
    const dy = target.y - body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Always correct rotation toward 0 — cards should be straight
    if (Math.abs(body.angle) > 0.001) {
      Body.setAngle(body, body.angle * 0.8);
      Body.setAngularVelocity(body, body.angularVelocity * 0.5);
    }

    // Snap to target when close enough — eliminates jitter
    if (distance < SNAP_DISTANCE) {
      Body.setPosition(body, target);
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      Body.setAngle(body, 0);
      return;
    }

    const forceMagnitude = distance * strength;
    Body.applyForce(body, body.position, {
      x: (dx / distance) * forceMagnitude,
      y: (dy / distance) * forceMagnitude,
    });
    Sleeping.set(body, false);
  });
}

export function applyEntranceBurstToBody(
  body: Matter.Body,
  center: Position,
  strength = 8,
): void {
  if (body.isStatic) return;

  const dx = body.position.x - center.x;
  const dy = body.position.y - center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 1) return;

  const normalizedDistance = Math.max(distance, 100);
  const velocityScale = strength * (200 / normalizedDistance);

  Body.setVelocity(body, {
    x: (dx / distance) * velocityScale + (Math.random() - 0.5) * 2,
    y: (dy / distance) * velocityScale + (Math.random() - 0.5) * 2,
  });
  Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
  Sleeping.set(body, false);
}

export function applyEntranceBurst(
  bodies: Map<string, Matter.Body>,
  center: Position,
  strength = 8,
): void {
  bodies.forEach((body, id) => {
    if (id === INFO_CARD_ID) return;
    applyEntranceBurstToBody(body, center, strength);
  });
}

export function applyDamping(bodies: Map<string, Matter.Body>, factor: number): void {
  bodies.forEach((body, id) => {
    if (body.isStatic || id === INFO_CARD_ID) return;

    Body.setVelocity(body, {
      x: body.velocity.x * factor,
      y: body.velocity.y * factor,
    });
    Body.setAngularVelocity(body, body.angularVelocity * factor);
  });
}

export function areBodiesSettled(
  bodies: Map<string, Matter.Body>,
  velocityThreshold = 0.5,
): boolean {
  for (const body of bodies.values()) {
    if (body.isStatic || body.isSleeping) continue;

    const speed = Math.sqrt(
      body.velocity.x * body.velocity.x +
      body.velocity.y * body.velocity.y,
    );

    if (speed > velocityThreshold) return false;
  }

  return true;
}
