/**
 * Aim Trainer - Game logic hooks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, GameSettings, Target, GameMode } from './AimTrainer.types';
import { HIT_SCORE, ARENA, MODE_SETTINGS, TARGET_SIZE_BASE } from './AimTrainer.config';

let targetIdCounter = 0;

function generateTargetId(): string {
  return `target-${++targetIdCounter}`;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomTrackingVelocity(): [number, number, number] {
  const horizontalDirection = Math.random() > 0.5 ? 1 : -1;
  const verticalDirection = Math.random() > 0.5 ? 1 : -1;

  return [
    randomInRange(0.04, 0.08) * horizontalDirection,
    randomInRange(0.02, 0.05) * verticalDirection,
    randomInRange(-0.015, 0.015),
  ];
}

function generateTarget(mode: GameMode, size: number): Target {
  // Generate position based on mode
  let x: number, y: number, z: number;

  switch (mode) {
    case 'gridShot':
      // Grid pattern
      x = randomInRange(-ARENA.width / 3, ARENA.width / 3);
      y = randomInRange(-ARENA.height / 4, ARENA.height / 3);
      z = randomInRange(-ARENA.depth / 2, -ARENA.depth / 4);
      break;
    case 'spiderShot':
      // Around center
      const angle = Math.random() * Math.PI * 2;
      const distance = randomInRange(2, 5);
      x = Math.cos(angle) * distance;
      y = Math.sin(angle) * distance * 0.6;
      z = randomInRange(-8, -4);
      break;
    case 'tracking':
    case 'flick':
    default:
      x = randomInRange(-ARENA.width / 3, ARENA.width / 3);
      y = randomInRange(-ARENA.height / 4, ARENA.height / 3);
      z = randomInRange(-ARENA.depth / 2, -ARENA.depth / 4);
      break;
  }

  return {
    id: generateTargetId(),
    position: [x, y, z],
    size: TARGET_SIZE_BASE * size,
    active: true,
    spawnTime: Date.now(),
    velocity: mode === 'tracking' ? randomTrackingVelocity() : undefined,
  };
}

function createInitialState(): GameState {
  return {
    status: 'idle',
    targets: [],
    hits: 0,
    misses: 0,
    totalShots: 0,
    score: 0,
    startTime: null,
    elapsedTime: 0,
  };
}

export function useAimTrainer() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'gridShot',
    duration: 30,
    targetSize: 1.0,
    sensitivity: 1.0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateTargetPosition = useCallback((target: Target, deltaMs: number): Target => {
    if (!target.velocity) return target;

    const [x, y, z] = target.position;
    let [vx, vy, vz] = target.velocity;
    let nextX = x + vx * (deltaMs / 100);
    let nextY = y + vy * (deltaMs / 100);
    let nextZ = z + vz * (deltaMs / 100);
    const xLimit = ARENA.width / 3;
    const yMin = -ARENA.height / 4;
    const yMax = ARENA.height / 3;
    const zMin = -ARENA.depth / 2;
    const zMax = -ARENA.depth / 4;

    if (nextX < -xLimit || nextX > xLimit) {
      vx *= -1;
      nextX = Math.max(Math.min(nextX, xLimit), -xLimit);
    }

    if (nextY < yMin || nextY > yMax) {
      vy *= -1;
      nextY = Math.max(Math.min(nextY, yMax), yMin);
    }

    if (nextZ < zMin || nextZ > zMax) {
      vz *= -1;
      nextZ = Math.max(Math.min(nextZ, zMax), zMin);
    }

    return {
      ...target,
      position: [nextX, nextY, nextZ],
      velocity: [vx, vy, vz],
    };
  }, []);

  // Spawn targets based on mode
  const spawnTargets = useCallback(() => {
    const modeSettings = MODE_SETTINGS[settings.mode];

    setState((s) => {
      if (s.status !== 'playing') return s;

      // Remove expired targets
      const now = Date.now();
      const validTargets = s.targets.filter((t) => {
        if (!t.active) return false;
        if (modeSettings.targetLifetime === Infinity) return true;
        return now - t.spawnTime < modeSettings.targetLifetime;
      });

      // Spawn new targets if needed
      const newTargets = [...validTargets];
      while (newTargets.length < modeSettings.maxTargets) {
        newTargets.push(generateTarget(settings.mode, settings.targetSize));
      }

      return { ...s, targets: newTargets };
    });
  }, [settings.mode, settings.targetSize]);

  // Start game
  const startGame = useCallback(() => {
    targetIdCounter = 0;

    setState({
      status: 'playing',
      targets: [],
      hits: 0,
      misses: 0,
      totalShots: 0,
      score: 0,
      startTime: Date.now(),
      elapsedTime: 0,
    });

    // Initial spawn
    setTimeout(spawnTargets, 100);
  }, [spawnTargets]);

  // Handle shot
  const handleShot = useCallback((targetId: string | null) => {
    setState((s) => {
      if (s.status !== 'playing') return s;

      if (targetId) {
        // Hit
        const newTargets = s.targets.map((t) =>
          t.id === targetId ? { ...t, active: false } : t
        );

        return {
          ...s,
          targets: newTargets,
          hits: s.hits + 1,
          totalShots: s.totalShots + 1,
          score: s.score + HIT_SCORE,
        };
      } else {
        // Miss
        return {
          ...s,
          misses: s.misses + 1,
          totalShots: s.totalShots + 1,
        };
      }
    });

    // Spawn new target after hit
    if (targetId) {
      setTimeout(spawnTargets, 50);
    }
  }, [spawnTargets]);

  // Timer and spawning
  useEffect(() => {
    if (state.status !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      return;
    }

    // Game timer
    timerRef.current = setInterval(() => {
      setState((s) => {
        if (s.status !== 'playing' || !s.startTime) return s;

        const now = Date.now();
        const elapsed = Math.floor((now - s.startTime) / 1000);
        const modeSettings = MODE_SETTINGS[settings.mode];
        let expiredTargetCount = 0;

        const targets = s.targets
          .map((target) => settings.mode === 'tracking'
            ? updateTargetPosition(target, 100)
            : target)
          .filter((target) => {
            if (modeSettings.targetLifetime === Infinity) return target.active;
            const isExpired = now - target.spawnTime >= modeSettings.targetLifetime;

            if (target.active && isExpired) {
              expiredTargetCount += 1;
              return false;
            }

            return target.active;
          });

        const nextState = {
          ...s,
          targets,
          elapsedTime: Math.min(elapsed, settings.duration),
          misses: s.misses + expiredTargetCount,
          totalShots: s.totalShots + expiredTargetCount,
        };

        if (elapsed >= settings.duration) {
          return { ...nextState, status: 'finished' as const };
        }

        return nextState;
      });
    }, 100);

    // Target spawner
    const modeSettings = MODE_SETTINGS[settings.mode];
    if (modeSettings.spawnInterval > 0) {
      spawnTimerRef.current = setInterval(spawnTargets, modeSettings.spawnInterval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [state.status, settings.duration, settings.mode, spawnTargets, updateTargetPosition]);

  // Reset game
  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    setState(createInitialState());
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettings((s) => ({ ...s, ...updates }));
  }, []);

  // Calculate accuracy
  const accuracy = state.totalShots > 0
    ? Math.round((state.hits / state.totalShots) * 100)
    : 0;

  return {
    ...state,
    settings,
    accuracy,
    timeRemaining: settings.duration - state.elapsedTime,
    startGame,
    resetGame,
    handleShot,
    updateSettings,
  };
}
