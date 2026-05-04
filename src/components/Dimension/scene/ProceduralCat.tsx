import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { isMobileDevice } from '../Dimension.utils';

interface ProceduralCatProps {
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
}

/**
 * Procedural cat assembled from primitives — body sphere, head sphere,
 * cone ears, cylinder tail, sphere eyes/nose. Single warm orange palette
 * for brand cohesion. Drawn entirely on the GPU; no asset to load.
 *
 * Sentinel `selectedModel.path` of `procedural:cat` routes here via
 * ModelWrapper. Geometry is created via JSX primitives; materials are
 * memoized so we don't allocate per render.
 */
export function ProceduralCat({
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: ProceduralCatProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);

  // Brand-warm palette — primary fur, deeper accent, charcoal features
  const materials = useMemo(() => {
    return {
      fur: new THREE.MeshStandardMaterial({
        color: '#E07A2D',
        roughness: 0.7,
        metalness: 0.05,
        wireframe: isWireframe,
      }),
      furDark: new THREE.MeshStandardMaterial({
        color: '#A04A18',
        roughness: 0.75,
        metalness: 0.05,
        wireframe: isWireframe,
      }),
      face: new THREE.MeshStandardMaterial({
        color: '#1f2937',
        roughness: 0.4,
        metalness: 0.1,
        wireframe: isWireframe,
      }),
      eyes: new THREE.MeshStandardMaterial({
        color: '#FFD66E',
        emissive: '#553300',
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.2,
        wireframe: isWireframe,
      }),
    };
  }, [isWireframe]);

  // Auto-rotate the whole cat as one rigid group.
  useFrame((_, delta) => {
    if (!autoRotate || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.4 * rotationSpeed;
  });

  const castShadow = !isMobile;
  const receiveShadow = !isMobile;

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      scale={1.2}
      position={[0, -0.5, 0]}
      dispose={null}
    >
      {/* Body — slightly elongated capsule via scaled sphere */}
      <mesh
        position={[0, 0.7, 0]}
        scale={[1.1, 0.95, 1.6]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        material={materials.fur}
      >
        <sphereGeometry args={[0.9, 32, 24]} />
      </mesh>

      {/* Head */}
      <mesh
        position={[0, 1.55, 1.0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        material={materials.fur}
      >
        <sphereGeometry args={[0.65, 32, 24]} />
      </mesh>

      {/* Ears — left + right cones, tilted outward */}
      <mesh
        position={[-0.35, 2.15, 0.95]}
        rotation={[0, 0, -0.2]}
        castShadow={castShadow}
        material={materials.fur}
      >
        <coneGeometry args={[0.2, 0.45, 16]} />
      </mesh>
      <mesh
        position={[0.35, 2.15, 0.95]}
        rotation={[0, 0, 0.2]}
        castShadow={castShadow}
        material={materials.fur}
      >
        <coneGeometry args={[0.2, 0.45, 16]} />
      </mesh>

      {/* Inner ear accent — small darker cones */}
      <mesh
        position={[-0.35, 2.05, 1.0]}
        rotation={[0, 0, -0.2]}
        material={materials.furDark}
      >
        <coneGeometry args={[0.1, 0.25, 12]} />
      </mesh>
      <mesh
        position={[0.35, 2.05, 1.0]}
        rotation={[0, 0, 0.2]}
        material={materials.furDark}
      >
        <coneGeometry args={[0.1, 0.25, 12]} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.22, 1.65, 1.55]} material={materials.eyes}>
        <sphereGeometry args={[0.09, 16, 16]} />
      </mesh>
      <mesh position={[0.22, 1.65, 1.55]} material={materials.eyes}>
        <sphereGeometry args={[0.09, 16, 16]} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.45, 1.6]} material={materials.face}>
        <sphereGeometry args={[0.07, 12, 12]} />
      </mesh>

      {/* Tail — cylinder tilted up + back */}
      <mesh
        position={[0, 1.0, -1.2]}
        rotation={[0.6, 0, 0]}
        castShadow={castShadow}
        material={materials.fur}
      >
        <cylinderGeometry args={[0.1, 0.13, 1.2, 16]} />
      </mesh>

      {/* Tail tip */}
      <mesh
        position={[0, 1.55, -1.6]}
        castShadow={castShadow}
        material={materials.fur}
      >
        <sphereGeometry args={[0.13, 16, 16]} />
      </mesh>

      {/* Legs — four short cylinders for visual weight */}
      <mesh
        position={[-0.45, 0.05, 0.7]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        material={materials.fur}
      >
        <cylinderGeometry args={[0.16, 0.18, 0.5, 12]} />
      </mesh>
      <mesh
        position={[0.45, 0.05, 0.7]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        material={materials.fur}
      >
        <cylinderGeometry args={[0.16, 0.18, 0.5, 12]} />
      </mesh>
      <mesh
        position={[-0.45, 0.05, -0.6]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        material={materials.fur}
      >
        <cylinderGeometry args={[0.16, 0.18, 0.5, 12]} />
      </mesh>
      <mesh
        position={[0.45, 0.05, -0.6]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        material={materials.fur}
      >
        <cylinderGeometry args={[0.16, 0.18, 0.5, 12]} />
      </mesh>
    </group>
  );
}
