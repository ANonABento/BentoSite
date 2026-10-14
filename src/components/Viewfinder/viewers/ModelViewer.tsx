'use client';

/**
 * ModelViewer — an .stl or .glb/.gltf model on a turntable. Drag to orbit,
 * scroll to zoom; it turns slowly until touched. Imported lazily, so three.js
 * only loads when someone opens a 3D tab.
 */

import { Suspense, useMemo, useState } from 'react';
import { Box3, Sphere, Vector3, type BufferGeometry, type Object3D } from 'three';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export default function ModelViewer({ src }: { src: string }) {
  const [touched, setTouched] = useState(false);
  // Progress is drawn over the canvas in the DOM: drei's <Html> as a Suspense
  // fallback tears down its own root mid-render under React 19.
  const { active, progress } = useProgress();
  return (
    <div className="relative h-full bg-[radial-gradient(120%_90%_at_50%_40%,#2a2421_0%,#0e0b0a_75%)]">
      {active && (
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-crt text-xl text-ash">
          loading model {Math.round(progress)}%
        </span>
      )}
      <Canvas camera={{ fov: 35, position: [0, 0.6, 4.2], near: 0.01, far: 100 }} dpr={[1, 2]} onPointerDown={() => setTouched(true)}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} />
        <directionalLight position={[-5, -2, -4]} intensity={0.5} color="#e8823f" />
        <Suspense fallback={null}>
          {/\.stl(\?|$)/i.test(src) ? <Stl src={src} /> : <Gltf src={src} />}
        </Suspense>
        <OrbitControls makeDefault autoRotate={!touched} autoRotateSpeed={0.8} enableDamping />
      </Canvas>
    </div>
  );
}

/** Models come in any unit (an STL in mm, a GLB in m). Each is centred and scaled to this radius, so one camera fits all. */
const MODEL_RADIUS = 1.2;

function Stl({ src }: { src: string }) {
  const geometry = useLoader(STLLoader, src);
  const fit = useMemo(() => fitGeometry(geometry), [geometry]);
  // STL files are usually Z-up; the scene is Y-up.
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} scale={fit.scale}>
      <mesh geometry={geometry} position={fit.offset}>
        <meshStandardMaterial color="#d9d2c7" metalness={0.15} roughness={0.55} />
      </mesh>
    </group>
  );
}

function Gltf({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  const fit = useMemo(() => fitObject(scene), [scene]);
  return (
    <group scale={fit.scale}>
      <primitive object={scene} position={fit.offset} />
    </group>
  );
}

function fitSphere(sphere: Sphere) {
  return { scale: MODEL_RADIUS / (sphere.radius || 1), offset: sphere.center.clone().negate() };
}

function fitGeometry(geometry: BufferGeometry) {
  geometry.computeBoundingSphere();
  return fitSphere(geometry.boundingSphere ?? new Sphere(new Vector3(), 1));
}

function fitObject(object: Object3D) {
  return fitSphere(new Box3().setFromObject(object).getBoundingSphere(new Sphere()));
}
