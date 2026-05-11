import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SkeletonUtils } from 'three-stdlib';

interface GLTFModelProps {
  modelPath: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
  isMobile: boolean;
}

export function GLTFModel({
  modelPath,
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
  isMobile,
}: GLTFModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);

  // `useGLTF` returns the SAME cached scene to every consumer. Mutating
  // material flags or shadow casters on it leaks across instances and
  // outlives this component. Clone so each render has its own subtree
  // (SkeletonUtils.clone is the safe variant — handles skinned meshes,
  // shares geometries, deep-clones materials).
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3 * rotationSpeed;
    }
  });

  useEffect(() => {
    clonedScene.traverse((child) => {
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
  }, [isMobile, isWireframe, clonedScene]);

  // Dispose the cloned materials when the component unmounts (geometries
  // are shared with the cache via SkeletonUtils.clone, so we don't touch
  // those — drei's useGLTF.clear handles cache-level cleanup).
  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          if (material && typeof material.dispose === 'function') {
            material.dispose();
          }
        }
      });
    };
  }, [clonedScene]);

  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
}
