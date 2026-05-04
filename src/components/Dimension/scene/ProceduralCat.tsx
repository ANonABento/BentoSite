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

const CAT_BODY_COLOR = '#d97706'; // warm orange tabby
const CAT_BELLY_COLOR = '#fde68a'; // pale cream
const CAT_INNER_EAR_COLOR = '#fb923c';
const CAT_NOSE_COLOR = '#fb7185';
const CAT_EYE_COLOR = '#0f172a';

const SCALE = 1.4;

interface CatPart {
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  position: [number, number, number];
  rotation?: [number, number, number];
}

function buildCatParts(isWireframe: boolean): CatPart[] {
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: CAT_BODY_COLOR,
    roughness: 0.6,
    metalness: 0.05,
    wireframe: isWireframe,
  });
  const bellyMaterial = new THREE.MeshStandardMaterial({
    color: CAT_BELLY_COLOR,
    roughness: 0.7,
    metalness: 0.05,
    wireframe: isWireframe,
  });
  const innerEarMaterial = new THREE.MeshStandardMaterial({
    color: CAT_INNER_EAR_COLOR,
    roughness: 0.7,
    metalness: 0.05,
    wireframe: isWireframe,
  });
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: CAT_NOSE_COLOR,
    roughness: 0.5,
    metalness: 0,
    wireframe: isWireframe,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: CAT_EYE_COLOR,
    roughness: 0.3,
    metalness: 0.1,
    wireframe: isWireframe,
  });

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
    { geometry: body, material: bodyMaterial, position: [0, 0, 0] },
    { geometry: belly, material: bellyMaterial, position: [0, -0.45, 0.2] },

    // Head (positioned forward on +Z axis)
    { geometry: head, material: bodyMaterial, position: [0, 0.55, 1.55] },

    // Ears
    {
      geometry: outerEar,
      material: bodyMaterial,
      position: [-0.45, 1.25, 1.45],
      rotation: [0, 0, 0.15],
    },
    {
      geometry: outerEar,
      material: bodyMaterial,
      position: [0.45, 1.25, 1.45],
      rotation: [0, 0, -0.15],
    },
    {
      geometry: innerEar,
      material: innerEarMaterial,
      position: [-0.45, 1.18, 1.5],
      rotation: [0, 0, 0.15],
    },
    {
      geometry: innerEar,
      material: innerEarMaterial,
      position: [0.45, 1.18, 1.5],
      rotation: [0, 0, -0.15],
    },

    // Eyes
    { geometry: eye, material: eyeMaterial, position: [-0.32, 0.7, 2.32] },
    { geometry: eye, material: eyeMaterial, position: [0.32, 0.7, 2.32] },

    // Nose
    {
      geometry: nose,
      material: noseMaterial,
      position: [0, 0.4, 2.42],
      rotation: [Math.PI / 2, 0, 0],
    },

    // Tail — sweeping up behind the body
    {
      geometry: tail,
      material: bodyMaterial,
      position: [0, 0.5, -1.6],
      rotation: [Math.PI / 2.4, 0, 0],
    },

    // Legs (front-left, front-right, back-left, back-right)
    { geometry: leg, material: bodyMaterial, position: [-0.6, -1.0, 0.85] },
    { geometry: leg, material: bodyMaterial, position: [0.6, -1.0, 0.85] },
    { geometry: leg, material: bodyMaterial, position: [-0.6, -1.0, -0.85] },
    { geometry: leg, material: bodyMaterial, position: [0.6, -1.0, -0.85] },

    // Paws
    { geometry: paw, material: bellyMaterial, position: [-0.6, -1.32, 0.95] },
    { geometry: paw, material: bellyMaterial, position: [0.6, -1.32, 0.95] },
    { geometry: paw, material: bellyMaterial, position: [-0.6, -1.32, -0.75] },
    { geometry: paw, material: bellyMaterial, position: [0.6, -1.32, -0.75] },
  ];
}

/**
 * A simple procedural cat built from primitive Three.js geometries.
 *
 * Used as the bentOS default 3D viewer model — replaces the previous
 * "Default Placeholder" STL. Zero asset weight (no GLB to ship), no
 * external license obligations, and renders in the same Canvas as the
 * GLTF/STL pipeline.
 */
export function ProceduralCat({
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: ProceduralCatProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);
  const parts = useMemo(() => buildCatParts(isWireframe), [isWireframe]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3 * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} onClick={onClick} scale={SCALE}>
      {parts.map((part, index) => (
        // Geometry identity per part is stable across renders, so index keys are safe.
        <mesh
          key={index}
          geometry={part.geometry}
          material={part.material}
          position={part.position}
          rotation={part.rotation}
          castShadow={!isMobile}
          receiveShadow={!isMobile}
        />
      ))}
    </group>
  );
}
