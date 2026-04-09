'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { Target } from './AimTrainer.types';
import { COLORS, ARENA } from './AimTrainer.config';

interface TargetMeshProps {
  target: Target;
  onClick: () => void;
}

function TargetMesh({ target, onClick }: TargetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && target.active) {
      // Subtle pulse animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (!target.active) return null;

  return (
    <Sphere
      ref={meshRef}
      position={target.position}
      args={[target.size, 32, 32]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <meshStandardMaterial
        color={COLORS.target}
        emissive={COLORS.target}
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
}

interface ArenaProps {
  onMiss: () => void;
}

function Arena({ onMiss }: ArenaProps) {
  return (
    <group>
      {/* Back wall */}
      <Box
        position={[0, 0, -ARENA.depth]}
        args={[ARENA.width * 2, ARENA.height * 2, 0.2]}
        onClick={onMiss}
      >
        <meshStandardMaterial color="#1a1a2e" />
      </Box>

      {/* Floor */}
      <Box
        position={[0, -ARENA.height / 2 - 1, -ARENA.depth / 2]}
        args={[ARENA.width * 2, 0.2, ARENA.depth * 2]}
      >
        <meshStandardMaterial color="#0f0f1a" />
      </Box>

      {/* Grid lines on back wall */}
      <gridHelper
        args={[ARENA.width, 20, '#333', '#222']}
        position={[0, 0, -ARENA.depth + 0.2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

interface FPSControlsProps {
  sensitivity: number;
  enabled: boolean;
  onLockChange: (locked: boolean) => void;
}

function FPSControls({ sensitivity, enabled, onLockChange }: FPSControlsProps) {
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);

  useEffect(() => {
    if (controlsRef.current) {
      // Apply sensitivity to pointer speed
      const baseSpeed = 0.002;
      controlsRef.current.pointerSpeed = baseSpeed * sensitivity;
    }
  }, [sensitivity]);

  useEffect(() => {
    if (enabled && controlsRef.current) {
      controlsRef.current.lock();
    }
  }, [enabled]);

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={() => onLockChange(true)}
      onUnlock={() => onLockChange(false)}
    />
  );
}

interface Scene3DProps {
  targets: Target[];
  sensitivity: number;
  isPlaying: boolean;
  onHit: (targetId: string) => void;
  onMiss: () => void;
  onLockChange: (locked: boolean) => void;
}

export function Scene3D({
  targets,
  sensitivity,
  isPlaying,
  onHit,
  onMiss,
  onLockChange,
}: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 70 }}
      onPointerMissed={onMiss}
      style={{ touchAction: 'none' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#fff" />

      {/* Arena */}
      <Arena onMiss={onMiss} />

      {/* Targets */}
      {targets.map((target) => (
        <TargetMesh
          key={target.id}
          target={target}
          onClick={() => onHit(target.id)}
        />
      ))}

      {/* FPS Controls */}
      <FPSControls
        sensitivity={sensitivity}
        enabled={isPlaying}
        onLockChange={onLockChange}
      />
    </Canvas>
  );
}
