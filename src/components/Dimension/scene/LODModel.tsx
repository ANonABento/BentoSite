import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { DEFAULT_MODEL_PATH } from '../Dimension.config';
import type { LODModelProps } from '../Dimension.types';
import {
  getDistanceFromCamera,
  getLODLevel,
  getLODScale,
} from '../Dimension.utils';
import { SCENE_COLORS } from './constants';

const BASE_SCALE = 0.01;
const FPS_WINDOW_MS = 500;

export function LODModel({
  modelPath = DEFAULT_MODEL_PATH,
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
  isMobile,
}: LODModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  const fpsRef = useRef(60);
  const fpsSamplesRef = useRef<number[]>([]);
  const lodLevelRef = useRef(0);
  const geometry = useLoader(STLLoader, modelPath);

  useEffect(() => {
    const material = materialRef.current;
    return () => {
      material?.dispose();
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    if (autoRotate) {
      mesh.rotation.x += delta * 0.2 * rotationSpeed;
      mesh.rotation.y += delta * 0.3 * rotationSpeed;
    }

    const currentTime = clock.elapsedTime * 1000;
    const samples = fpsSamplesRef.current;
    samples.push(currentTime);
    while (samples.length > 1 && samples[0] < currentTime - FPS_WINDOW_MS) {
      samples.shift();
    }

    if (samples.length > 1) {
      const elapsed = samples[samples.length - 1] - samples[0];
      if (elapsed > 0) {
        fpsRef.current = Math.round(((samples.length - 1) * 1000) / elapsed);
      }
    }

    const distanceFromCamera = getDistanceFromCamera(
      camera.position,
      mesh.position
    );
    const nextLodLevel = getLODLevel(distanceFromCamera, isMobile, fpsRef.current);

    if (lodLevelRef.current !== nextLodLevel) {
      lodLevelRef.current = nextLodLevel;
      mesh.scale.setScalar(getLODScale(BASE_SCALE, nextLodLevel));
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      scale={BASE_SCALE}
      position={[0, 0, 0]}
      onClick={onClick}
      castShadow={!isMobile}
      receiveShadow={!isMobile}
      frustumCulled
    >
      <meshStandardMaterial ref={materialRef} color={SCENE_COLORS.model} wireframe={isWireframe} />
    </mesh>
  );
}
