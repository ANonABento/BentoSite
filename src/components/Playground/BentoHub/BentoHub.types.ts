/**
 * Bento Hub Types - Physics-based bento grid with collision
 */

import { ReactNode } from 'react';

// Card size variants for bento grid
export type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

// Card content types
export type CardContentType = 'game' | 'stat';

// Card color accents
export type CardColor = 'gold' | 'purple' | 'cyan';

export interface BentoCardConfig {
  id: string;
  size: CardSize;
  contentType: CardContentType;
  title: string;
  description?: string;
  icon?: ReactNode;
  color: CardColor;
  href?: string;
  gridArea: string;
}

export interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhysicsConfig {
  gravityStrength: number;
  collisionPadding: number;
  collisionForce: number;
  dragElastic: number;
  returnSpring: {
    stiffness: number;
    damping: number;
  };
  centerPullRadius: number;
}

// Physics state for collision context
export interface CardPhysicsState {
  id: string;
  homePosition: CardPosition;
  currentOffset: { x: number; y: number };
  isDragging: boolean;
}

// Collision detection result
export interface CollisionResult {
  cardA: string;
  cardB: string;
  overlap: number;
  pushDirection: { x: number; y: number };
}
