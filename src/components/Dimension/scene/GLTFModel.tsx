import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { isMobileDevice } from '../Dimension.utils';

interface GLTFModelProps {
  modelPath: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
}

export function GLTFModel({
  modelPath,
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: GLTFModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const isMobile = useMemo(() => isMobileDevice(), []);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3 * rotationSpeed;
    }
  });

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.wireframe = isWireframe;
          }
        });
      } else if (child.material instanceof THREE.MeshStandardMaterial) {
        child.material.wireframe = isWireframe;
      }

      child.castShadow = !isMobile;
      child.receiveShadow = !isMobile;
    });
  }, [isMobile, isWireframe, scene]);

  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive object={scene} scale={1} />
    </group>
  );
}
