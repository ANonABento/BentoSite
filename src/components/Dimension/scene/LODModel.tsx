import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { LODModelProps } from '../Dimension.types';
import { isMobileDevice } from '../Dimension.utils';
import { ORIGIN, SCENE_COLORS } from './constants';

export function LODModel({
  modelPath = '/models/placeholder.stl',
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: LODModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isMobile = useMemo(() => isMobileDevice(), []);
  const [lodLevel, setLodLevel] = useState(0);
  const geometry = useLoader(STLLoader, modelPath);

  useFrame((_, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.x += delta * 0.2 * rotationSpeed;
      meshRef.current.rotation.y += delta * 0.3 * rotationSpeed;
    }

    const currentTime = performance.now();
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
    }

    frameCountRef.current += 1;
    if (currentTime < lastTimeRef.current + 1000) {
      return;
    }

    fpsRef.current = Math.round(
      (frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)
    );
    frameCountRef.current = 0;
    lastTimeRef.current = currentTime;

    const meshPosition = meshRef.current?.position || ORIGIN;
    const distanceFromCamera = camera.position.distanceTo(meshPosition);
    const fps = fpsRef.current;

    let nextLodLevel = 0;
    if (isMobile || fps < 30) {
      if (distanceFromCamera > 10) {
        nextLodLevel = 2;
      } else if (distanceFromCamera > 5) {
        nextLodLevel = 1;
      }
    } else if (distanceFromCamera > 20) {
      nextLodLevel = 2;
    } else if (distanceFromCamera > 10) {
      nextLodLevel = 1;
    }

    setLodLevel((previousLevel) =>
      previousLevel !== nextLodLevel ? nextLodLevel : previousLevel
    );
  });

  const scale =
    lodLevel === 2 ? 0.008 : lodLevel === 1 ? 0.009 : 0.01;

  const materialProps = useMemo(
    () => ({
      color: SCENE_COLORS.model,
      wireframe: isWireframe,
    }),
    [isWireframe]
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      scale={scale}
      position={[0, 0, 0]}
      onClick={onClick}
      castShadow={!isMobile}
      receiveShadow={!isMobile}
      frustumCulled
    >
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}
