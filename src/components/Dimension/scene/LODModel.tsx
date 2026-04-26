import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { DEFAULT_MODEL_PATH } from '../Dimension.config';
import type { LODModelProps } from '../Dimension.types';
import {
  getDistanceFromCamera,
  getLODLevel,
  getLODScale,
  isMobileDevice,
} from '../Dimension.utils';
import { SCENE_COLORS } from './constants';

export function LODModel({
  modelPath = DEFAULT_MODEL_PATH,
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

    const distanceFromCamera = getDistanceFromCamera(
      camera.position,
      meshRef.current?.position
    );
    const nextLodLevel = getLODLevel(distanceFromCamera, isMobile, fpsRef.current);

    setLodLevel((previousLevel) =>
      previousLevel !== nextLodLevel ? nextLodLevel : previousLevel
    );
  });

  const scale = getLODScale(0.01, lodLevel);

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
