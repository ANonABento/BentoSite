import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ProceduralCatProps {
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
}

const CAT_BODY_COLOR = '#d97706'; // warm orange tabby
const CAT_BELLY_COLOR = '#fde68a'; // pale cream
const CAT_INNER_EAR_COLOR = '#fb923c';
const CAT_NOSE_COLOR = '#fb7185';
const CAT_EYE_COLOR = '#0f172a';

const SCALE = 0.85;

interface MaterialSpec {
  color: string;
  roughness: number;
  metalness: number;
}

const MATERIALS: Record<'body' | 'belly' | 'innerEar' | 'nose' | 'eye', MaterialSpec> = {
  body: { color: CAT_BODY_COLOR, roughness: 0.6, metalness: 0.05 },
  belly: { color: CAT_BELLY_COLOR, roughness: 0.7, metalness: 0.05 },
  innerEar: { color: CAT_INNER_EAR_COLOR, roughness: 0.7, metalness: 0.05 },
  nose: { color: CAT_NOSE_COLOR, roughness: 0.5, metalness: 0 },
  eye: { color: CAT_EYE_COLOR, roughness: 0.3, metalness: 0.1 },
};

interface CatPart {
  geometry: THREE.BufferGeometry;
  material: keyof typeof MATERIALS;
  position: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Build the part list with fresh geometries. Geometries live on the GPU
 * and aren't garbage-collected — the consumer must dispose them on unmount.
 * Materials are declared via JSX so React's r3f reconciler handles their
 * lifecycle automatically.
 */
function buildCatParts(): CatPart[] {
  // Body — capsule along Z so head sits in front
  const body = new THREE.CapsuleGeometry(1.1, 1.6, 6, 14);
  body.rotateZ(Math.PI / 2);

  // Belly highlight (slightly inside body, lighter)
  const belly = new THREE.SphereGeometry(0.95, 18, 14);
  belly.scale(1.0, 0.7, 1.4);

  // Head — sphere
  const head = new THREE.SphereGeometry(0.95, 22, 18);

  // Outer ears (cones)
  const outerEar = new THREE.ConeGeometry(0.32, 0.7, 14);
  // Inner ears (smaller cones, inset)
  const innerEar = new THREE.ConeGeometry(0.18, 0.5, 12);

  // Eyes
  const eye = new THREE.SphereGeometry(0.11, 12, 10);

  // Nose — small triangular pyramid
  const nose = new THREE.ConeGeometry(0.1, 0.14, 4);

  // Tail — torus segment for a curved-up tail
  const tail = new THREE.TorusGeometry(0.55, 0.13, 10, 22, Math.PI * 1.2);

  // Legs — short cylinders
  const leg = new THREE.CylinderGeometry(0.22, 0.24, 0.6, 12);

  // Paws — flattened spheres
  const paw = new THREE.SphereGeometry(0.26, 12, 10);
  paw.scale(1, 0.55, 1.1);

  return [
    // Body
    { geometry: body, material: 'body', position: [0, 0, 0] },
    { geometry: belly, material: 'belly', position: [0, -0.45, 0.2] },

    // Head (positioned forward on +Z axis)
    { geometry: head, material: 'body', position: [0, 0.55, 1.55] },

    // Ears
    { geometry: outerEar, material: 'body', position: [-0.45, 1.25, 1.45], rotation: [0, 0, 0.15] },
    { geometry: outerEar, material: 'body', position: [0.45, 1.25, 1.45], rotation: [0, 0, -0.15] },
    { geometry: innerEar, material: 'innerEar', position: [-0.45, 1.18, 1.5], rotation: [0, 0, 0.15] },
    { geometry: innerEar, material: 'innerEar', position: [0.45, 1.18, 1.5], rotation: [0, 0, -0.15] },

    // Eyes
    { geometry: eye, material: 'eye', position: [-0.32, 0.7, 2.32] },
    { geometry: eye, material: 'eye', position: [0.32, 0.7, 2.32] },

    // Nose
    { geometry: nose, material: 'nose', position: [0, 0.4, 2.42], rotation: [Math.PI / 2, 0, 0] },

    // Tail — sweeping up behind the body
    { geometry: tail, material: 'body', position: [0, 0.5, -1.6], rotation: [Math.PI / 2.4, 0, 0] },

    // Legs (front-left, front-right, back-left, back-right)
    { geometry: leg, material: 'body', position: [-0.6, -1.0, 0.85] },
    { geometry: leg, material: 'body', position: [0.6, -1.0, 0.85] },
    { geometry: leg, material: 'body', position: [-0.6, -1.0, -0.85] },
    { geometry: leg, material: 'body', position: [0.6, -1.0, -0.85] },

    // Paws
    { geometry: paw, material: 'belly', position: [-0.6, -1.32, 0.95] },
    { geometry: paw, material: 'belly', position: [0.6, -1.32, 0.95] },
    { geometry: paw, material: 'belly', position: [-0.6, -1.32, -0.75] },
    { geometry: paw, material: 'belly', position: [0.6, -1.32, -0.75] },
  ];
}

/**
 * A simple procedural cat built from primitive Three.js geometries.
 *
 * Geometries are constructed once and reused across renders — toggling
 * wireframe just swaps the JSX `wireframe` prop, which is reconciled
 * declaratively by r3f instead of allocating new Material/Geometry objects.
 * On unmount we dispose the GPU-resident geometries so they don't leak.
 */
export function ProceduralCat({
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: ProceduralCatProps) {
  const groupRef = useRef<THREE.Group>(null);
  const parts = useMemo(() => buildCatParts(), []);

  useEffect(() => {
    return () => {
      for (const part of parts) {
        part.geometry.dispose();
      }
    };
  }, [parts]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3 * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} onClick={onClick} scale={SCALE}>
      {parts.map((part, index) => {
        const mat = MATERIALS[part.material];
        // Geometry identity per part is stable across renders, so index keys are safe.
        return (
          <mesh
            key={index}
            geometry={part.geometry}
            position={part.position}
            rotation={part.rotation}
          >
            <meshStandardMaterial
              color={mat.color}
              roughness={mat.roughness}
              metalness={mat.metalness}
              wireframe={isWireframe}
            />
          </mesh>
        );
      })}
    </group>
  );
}
